'use strict';

var fs = require('fs-extra');
var path = require('path');
var url = require('url');

var getParentSlug = function(resource) {
    var paths = resource.path.split('/');
    return paths[paths.length - 3];
};

var createSource = function(resource) {
    var source = resource.metadata || {};
    source.path = resource.path;
    source.index = resource.ordinal;
    if (resource.storage) {
        source.details = resource.storage.metadata;
        source.url = source.namespace + source.filename;
        if (!source.title || !source.title.trim()) {
            source.title = source.filename;
        }
    } else {
        source.url = source.path;
    }
    return source;
};

var mapResource = function(amphora, resource) {
    var resources = amphora.resources;
    var prop = getParentSlug(resource);
    resources[prop] = resources[prop] || [];
    resources[prop].push(createSource(resource));
    resources[prop].sort(function(a, b) {
        return a.index - b.index;
    });
};

var apply = function(context, content, resource, callback) {
    if (resource._links.inline && resource.storage) {
        mapResource(content.amphora, resource);
        context.app.amphora.utils.store(context, resource, callback);
    } else if (resource.metadata.type) {
        mapResource(content.amphora, resource);
        callback(null, content);
    } else {
        callback(null, content);
    }
};

module.exports = apply;
