'use strict';

var path = require('path');
var async = require('async');
var cache = require('./amphora-cache');
var config = require('config-weaver').config();
var request = require('request');
var fs = require('fs-extra');

var getContent = function(context, resource, callback) {
    request(resource._links.inline.href, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(null, body);
        } else {
            error = { error: error || response.body }
            error.resource = resource.path;
            callback(error);
        }
    });
};

var download = function(resourceItem, callback) {
    var downloadRequest = request.get(resourceItem.url);
    downloadRequest.on('response', function(response) {
        if (response.statusCode === 200) {
            console.log('Amphora', resourceItem.url);
            cache.cacheResource(downloadRequest, resourceItem, callback);
        } else {
            callback({
                error: 'Failed to download content',
                status: response.statusCode,
                url: resourceItem.url
            });
            downloadRequest.abort();
        }
    }).on('error', callback);
};

var downloadQueuedResource = function(app, resourceItem, callback) {
    cache.getLocalPath(resourceItem, function(err, localPath) {
        if (err) {
            download(resourceItem, function(err) {
                if (err) {
                    app.context.errors.push(err);
                }
                callback(true);
            });
        } else {
            fs.ensureSymlink(localPath, resourceItem.destination, function() {
                callback(false);
            });
        }
    });
};

var downloadQueuedResources = function(app, callback) {
    var now = new Date().getTime();
    var fromCache = 0;
    var remote = 0;
    async.eachLimit(app.context.resourceQueue, 30, function(resourceItem, subCallback) {
        downloadQueuedResource(app, resourceItem, function(fromAmphora){
            if (fromAmphora) {
                remote++;
            } else {
                fromCache++;
            }
            subCallback();
        });
    }, function(err) {
        if (app.context.resourceQueue.length > 0) {
            console.log('\nAmphora', app.context.resourceQueue.length,
                'documents called', ', from local-cache:',
                fromCache, ', from amphora:',
                remote, ', time:', ((new Date().getTime() - now) / 1000) + 's');
        }
        callback(err);
    });
};

var store = function(context, resource, callback) {
    var filename = resource.metadata.filename || resource.slug
    var target = context.app.preview ? 'pdfs' : 'pages';

    var base = path.join(config.tempdir, target, resource.metadata.namespace);
    var destination = path.join(base, filename);
    var resourceItem = {
        storage: {
            checksum: resource.storage.checksum,
        },
        url: resource._links.inline.href,
        destination: destination
    };
    if (context.app.preview) {
        fs.exists(destination, function(exists) {
            if (exists) {
                callback();
            } else {
                download(resourceItem, callback);
            }
        });
    } else {
        context.app.context.resourceQueue.push(resourceItem);
        callback();
    }
};

module.exports = {
    store: store,
    getContent: getContent,
    downloadQueuedResources: downloadQueuedResources,
    cache: cache
};
