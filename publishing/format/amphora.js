'use strict';

var async = require('async');
var documents = require('./_handlers/amphora/documents');
var utils = require('./amphora-download-utils');
var restler = require('restler');

var path = require('path');

var findHandler = function(resource) {
    if (resource.metadata.type) {
        try {
            // find shared handler
            return require('./_handlers/amphora/' + resource.metadata.type);
        } catch (e) {
            try {
                // shared handler not found, check site-specific handler
                return require(path.join(process.cwd(), 'resources/_handlers/amphora/', resource.metadata.type));
            } catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    return require('./_handlers/amphora/generic');
                } else {
                    throw e;
                }
            }
        }
    } else {
        return require('./_handlers/amphora/generic');
    }
};

// recursively handle each item
var handle = function(context, content, amphoraResource, callback) {
    if (amphoraResource.metadata.required !== false) {
        findHandler(amphoraResource)(context, content, amphoraResource, function() {
            async.each(amphoraResource.resources, function(childResource, subCallback) {
                handle(context, content, childResource, subCallback);
            }, callback);
        });
    } else {
        callback(null, content);
    }
};

var fetch = function(context, url, callback) {
    restler.get(url)
        .on('complete', function(resource, response) {
            if (resource instanceof Error || response.statusCode !== 200) {
                var error = { err: resource } || {};
                error.error = 'Failed to fetch amphora resource:' + url;
                error.status = response ? response.statusCode : '';
                callback(error);
            } else {
                callback(null, resource);
            }
        });
};

var resource = function(context, namespace, callback) {
    var location = context.app.config.amphora.endpoint + 'resource' + namespace;
    fetch(context, location, callback);
};

var assemble = function(context, content, callback) {
    content.amphora = { resources: {} };
    var location = context.app.config.amphora.endpoint + 'assemble' + content.url;
    fetch(context, location, function(err, resource) {
        if (err) {
            err.id = content.uuid;
            err.resource = content.url;
            context.app.context.errors.push(err);
            // legacy application ignores amphora failures
            console.log(err);
            callback(null, content);
        } else {

            handle(context, content, resource, callback);
        }
    });
};

module.exports = {
    assemble: assemble,
    resource: resource,
    handle: handle,
    documents: documents,
    utils: utils
};