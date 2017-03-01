'use strict';

var path = require('path');
var fs = require('fs');

/**
 * Contains the logic needed to save the files required for a content item.
 **/
var PrepareContext = require('../publishing/prepare-context');

module.exports = function(target, app, contentHandler) {

    var async = require('async');
    var siteIndexes = require('./site-indexes')(target);

    function diffIndexes(indexPath, newIndex, callback) {
        var lastIndex = siteIndexes.lastBuildIndex(indexPath);
        var diff = siteIndexes.diffBuildIndexes(newIndex, lastIndex);
        callback(null, diff);
    }

    function removeContentItems(diff, context, callback) {
        async.each(diff.deleted.concat(diff.changedOrNew),
            (id, cb) => contentHandler.removeContentItem(context, id, cb),
            (err) => callback(err, diff));
    }

    function generateItems(diff, context, callback) {
        async.eachLimit(diff.changedOrNew, 30,
            (id, cb) => context.fetchItem(id,
                    (err, content) => {
                        if (err) {
                            cb(err);
                        } else {
                            contentHandler.handleContentItem(context, content, cb);
                        }
                    }),
                    (err) => callback(err, diff));
    }

    return {
        generate: function(callback) {
            var indexPath = path.join(target, 'siteIndex.json');
            var context = app.createPrepareContext('siteBuild');
            async.waterfall([
                cb => contentHandler.start(cb),
                cb => app.contentSource.fetchCachableItems(null, 'siteBuild', cb),
                (buildIndex, cb) => diffIndexes(indexPath, buildIndex, cb),
                (diff, cb) => removeContentItems(diff, context, cb),
                (diff, cb) => generateItems(diff, context, cb),
                (diff, cb) => fs.writeFile(indexPath, JSON.stringify(diff.newIndex, null, '\t'), cb)
            ],
            // end callback...
            err => contentHandler.end(err, callback));
        }
    };
};
