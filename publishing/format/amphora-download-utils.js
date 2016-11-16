'use strict';

var path = require('path');
var async = require('async');
var cache = require('./amphora-cache');
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

var download = function(url, destination, callback) {
    fs.ensureDir(path.dirname(destination), function() {
       
        var downloadRequest = request.get(url);
        downloadRequest.on('response', function(response) {
            if (response.statusCode === 200) {
                 console.log('Amphora', url);
                var file = fs.createWriteStream(destination);
                downloadRequest.pipe(file);
                file.on('finish', callback);
                file.on('error', function(e) {
                    fs.unlink(destination, function(e) {
                        callback({
                            error: 'failed to stream content',
                            details: e,
                            destination: destination
                        });
                    });
                });
            } else {
                callback({
                    error: 'Failed to download content',
                    status: response.statusCode,
                    url: url
                });
                downloadRequest.abort();
            }
        }).on('error', callback);
    });
};

var downloadQueuedResources = function(app, callback) {
    var now = new Date().getTime();
    var fromCache = 0;
    var remote = 0;
    async.eachLimit(app.context.resourceQueue, 30, function(resourceItem, subCallback) {
        cache.getLocalResource(resourceItem, function(err, stream) {
            if (err) {
                remote++;
                download(resourceItem.url, resourceItem.destination,
                    function(err) {
                        if (!err) {
                            cache.cacheResource(resourceItem, subCallback);
                        } else {
                            app.context.errors.push(err);
                            subCallback();
                        }
                    });
            } else {
                fromCache++;
                fs.ensureDir(path.dirname(resourceItem.destination), function() {
                    var file = fs.createWriteStream(resourceItem.destination);
                    stream.pipe(file);
                    file.on('finish', subCallback);
                });
            }
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
    var base = path.join('out', target, resource.metadata.namespace);
    var destination = path.join(base, filename);
    if (context.app.preview) {
        fs.exists(destination, function(exists) {
            if (exists) {
                callback();
            } else {
                download(resource._links.inline.href, destination, callback);
            }
        });
    } else {
        context.app.context.resourceQueue.push({
            storage: {
                checksum: resource.storage.checksum,
            },
            url: resource._links.inline.href,
            destination: destination
        });
        callback();
    }
};

module.exports = {
    store: store,
    getContent: getContent,
    download: download,
    downloadQueuedResources: downloadQueuedResources
};
