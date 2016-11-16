'use strict';

/**
 * Contains the logic needed to save the files required for a content item.
 **/
var PrepareContext = require('../publishing/prepare-context');

var onEnd = function(err, app, contentHandler, callback) {
    contentHandler.end(err, function() {
        callback(err);
    });
};

module.exports = function(app, contentHandler) {

    var async = require('async');

    var generateItem = function(id, callback) {
        var context = app.createPrepareContext('siteBuild');
        context.fetchItem(id, function(err, content) {
            if (err) {
                console.error('failed to fetch content item ' + id + ', error: ' + JSON.stringify(err));
                callback(err);
            } else {
                contentHandler.handleContentItem(context, content, callback);
            }
        });
    };

    var generateItems = function(callback) {
        if (app.context.ids) {
            async.each(app.context.ids, generateItem, callback);
        } else {
            app.contentSource.fetchItems(null, 'siteBuild', function(err, ids) {
                async.eachLimit(ids, 80, generateItem, callback);
            });
        }
    };

    return {
        generate: function(callback) {
            async.series([
                    contentHandler.start,
                    generateItems
                ],
                function(err) {
                    onEnd(err, app, contentHandler, callback);
                });
        }
    };
};
