'use strict';

/**
 * Used to copy dynamically resized images generatd by the render stage into
 * a set of required static images as part of the site build.
 *
 * To do this is it requires a router object.
 */
var fs = require('fs-extra');
var http = require('http');
var url = require('url');
var path = require('path');
var async = require('async');
var config = require('config-weaver').config();

function AssetCopier(router) {
    this.router = router;

    // default do nothing callbacks. Override by using 'on'
    this.callbacks = {
        // Called when the copy is about to start: index, targetDir
        start : [],

        // called when an asset has been copied: src, downstream, to
        copied : [],

        // calleed if an asset has been skipped due to no routing information: assetUrl, reason
        skipped: [],

        // called when the copy is finished: err
        done: []
    };
}

AssetCopier.prototype.copy = function(index, targetDir) {
    var that = this;
    that.fire('start', index, targetDir);

    /// AGH, when you limit this to 1 we get a Fatal error: EBADF, close
    async.eachLimit(index, 10,
        function (assetUrl, callback) {
            // route the asset url to determine where to fetch it from
            var routed = that.router({method: 'GET', url: assetUrl});

            if (routed instanceof url.Url) {
                // we go a url, copy the asset
                var targetUrl = targetDir + assetUrl;
                that.copyAsset(assetUrl, routed.href, targetUrl, callback);
            } else {
                // the router did not give us a url, skip it.
                that.fire('skipped', assetUrl, 'router did not return a downstream url');
                callback();
            }
        },
        function (err) {
            that.fire('done', err);
        }
    );
};

AssetCopier.prototype.copyAsset = function(assetUrl, downstreamUrl, targetUrl, callback) {
    var that = this;
    var dir = path.dirname(targetUrl);

    async.series(
        [
            //async.apply(fs.ensureDir(dir)),
            function (cb) { fs.ensureDir(dir, cb); },
            function (cb) { that.fetch(downstreamUrl, assetUrl, targetUrl, cb); }
        ],

        function (err) { callback(err); }
    );
};

// fetch the downstream url and save it to target
AssetCopier.prototype.fetch = function(downstreamUrl, assetUrl, targetUrl, callback) {
    var that = this;

    // fetch the assetUrl and pipe to the file
    http.get(downstreamUrl,
        function(response) {
            if (response.statusCode >= 300) {
                var reason = 'Downstream url ' + downstreamUrl + ' returned ' + response.statusCode;
                that.fire('skipped', assetUrl, reason);
                response.resume();
                callback();
                return;
            }

            // open the target file
            var file = fs.createWriteStream(targetUrl);
            response.pipe(file);

            file.on('finish', function() {
                file.close(callback);
                that.fire('copied', assetUrl, downstreamUrl, targetUrl);
            });
        }).on('error', function(httpErr) {
            // got an error from http
            fs.exists(targetUrl, function (exists) {
                if (exists) {
                    fs.unlink(targetUrl);
                }
                callback(httpErr);
          });
        });
};

// register a listener for a given event
AssetCopier.prototype.on = function(event, callback) {
    this.callbacks[event].push(callback);
    return this;
};

// fire an event
AssetCopier.prototype.fire = function (event) {
    var args = Array.prototype.slice.call(arguments);
    // get rid of the 'event' argument, the callback dont need it
    args.shift();
    this.callbacks[event].forEach(function (cb) {
        cb.apply(cb, args);
    });
};

function create(router) {
    return new AssetCopier(router);
}

module.exports = {
    create: create
};
