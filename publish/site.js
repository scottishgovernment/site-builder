'use strict';

var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');
var async = require('async');
var links = require('../render/links');
var images = require('../render/images');
var pageFile = 'index.html';


var fileOptions = { encoding: 'utf-8' };
var layoutsDir;

/**
 * Generates a site by walking a directory tree of json files, rendering them as HTML.
 */
function Site(tempDir, renderer) {
    this.tempDir = tempDir;
    this.dataDir = path.join(tempDir, 'contentitems');
    this.htmlDir = path.join(tempDir, 'pages');
    this.renderer = renderer;
}

/**
 * Walks a directory tree of json files, rendering them to HTML.
 */
Site.prototype.build = function(done) {
    var that = this;
    var dataGlob = path.join(this.htmlDir, '**/index.json');
    glob(dataGlob, {}, function(err, files) {
        if (err) {
            done(err);
            return;
        }
        that.createUrlIndex(files, function(err, index) {
            that.index = index;
            that.imageLink = images.collector(
                function(url) {
                    return url;
                }
            );
            async.eachLimit(files, 4, that.processFile.bind(that), function() {
                var json = JSON.stringify(that.imageLink.urls, null, '\t');
                var assetsFile = path.join(that.tempDir, 'assets.json');
                fs.writeFileSync(assetsFile, json);
                done();
            });
        });
    });
};


Site.prototype.createUrlIndex = function(files, callback) {
    readFile(path.join(this.tempDir, 'siteIndex.json'), function(err, siteIndex) {
        if (!siteIndex || err) {
            // file does not exists, use legacy function to create index
            callback('siteIndex.json not found');
        } else {
            var urlById = {};
            siteIndex.forEach(function(siteIndexItem) {
                urlById[siteIndexItem.id] = siteIndexItem.url;
            });
            callback(null, urlById);
        }
    });
};


Site.prototype.processFile = function(src, cb) {
    var that = this;
    // create index.html for the json if it does not exist
    var pageContext = path.join(path.dirname(src), pageFile);
    fs.access(pageContext, (err) => {
        if (err && err.code === 'ENOENT') {
            fs.readFile(src, fileOptions, (error, data) => {
                error ? cb(error) : that.renderDataToFile(data, cb);
            });
        } else {
            cb(err);
        }
    });
};

function readFile(file, callback) {
    fs.readFile(file, fileOptions, function(err, data) {
        if (err) {
            callback('Could not read file: ' + file);
        }
        var item;
        try {
            item = JSON.parse(data);
        } catch (e) {
            callback('Could not parse file: ' + file + '\n' + e.message);
        }
        callback(null, item);
    });

}

Site.prototype.renderDataToFile = function(data, cb) {
    var item = JSON.parse(data);
    try {
        if (shouldRender(item)) {
            this.renderItemToFile(item, cb);
        } else {
            cb();
        }
    } catch (e) {
        e.message = 'Failed on item: ' + item.uuid + '\n' + e.message;
        throw e;
    }
};


function shouldRender(item) {
    return !item.contentItem._embedded.format._embedded.structural;
}

Site.prototype.renderItemToFile = function(item, cb) {
    var context = {
        rewriteLink: links.createRewriter(this.index),
        imageLink: this.imageLink
    };
    var html = this.renderer.render(item, context);
    var url = item.url;
    if (!url) {
        throw new Error('Item does not specify a URL.');
    }
    var dir = path.join(this.htmlDir, item.url);
    fs.mkdirs(dir, function() {
        fs.writeFile(path.join(dir, pageFile), html, fileOptions, cb);
    });
};

module.exports = {
    Site: Site
};
