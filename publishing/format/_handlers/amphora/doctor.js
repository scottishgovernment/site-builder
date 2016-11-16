'use strict';
var path = require('path');
var async = require('async');
var thumbnailWidths = [107, 165, 214, 330];

var thumbnail = function(width, context, source, callback) {
    var namespace = source.path + '?type=jpg&size=' + width;
    var file = source.metadata.filename;
    context.app.amphora.resource(context, namespace, function(err, resource) {
        if (err) {
            callback(err);
            return;
        }
        // override filename for doctor
        resource.metadata.filename = path.basename(file, path.extname(file)) + '.' + width + '.jpg';
        // override namespace
        resource.metadata.namespace = source.metadata.namespace;
        context.app.amphora.utils.store(context, resource, callback);
    });
};

var thumbnails = function(context, amphoraResource, callback) {
    async.each(thumbnailWidths,
        function(width, cb) {
            thumbnail(width, context, amphoraResource, cb);
        },
        callback
    );
};

var apply = function(context, content, amphoraResource, callback) {
    async.parallel([
            function(cb) {
                context.app.amphora.utils.store(
                    context, amphoraResource, cb)
            },
            function(cb) { thumbnails(context, amphoraResource, cb); }
        ],
        function(err, data) {
            if (err) {
                err = { error: err };
                err.uuid = content.uuid;
                err.resource = amphoraResource.path
                context.app.context.errors.push(err);
            }
            callback();
        });
};

module.exports = apply;