'use strict';

var async = require('async');
var path = require('path');

function handleContentItem(context, content, fs, target, callback) {
    cleanup(content, fs, target, function() {
        createJson(context, content, fs, target, callback);
    });
};

function createJson(context, content, fs, target, callback) {

    content.additionalItemUrls = [];
    var savePages = context.attributes[content.uuid].store;
    if (!context.attributes[content.uuid].additionalItems) {
        saveItem(fs, target, content, savePages, true, callback);
        return;
    }

    // there are additional items, delete this sub directory and then save them
    deleteAdditionalItemsIfExists(content, fs, target,
        (err) => {
            if (err) {
                callback(err);
            }
            var index = 0;
            context.attributes[content.uuid].additionalItems.each(
                (item, cb) => {
                    if (item.uuid === content.uuid) {
                        item.uuid = item.uuid + '-' + index;
                    }
                    content.additionalItemUrls.push(item.url);
                    saveItem(fs, target, item, savePages, false, cb);
                    index++;
                },
                () => saveItem(fs, target, content, savePages, true, callback));
        });
};

function deleteAdditionalItemsIfExists(content, fs, target, callback) {
    var itemPath = path.join(target, 'contentitems', content.uuid + '.json');
    fs.exists(itemPath, exists => {
        if (!exists) {
            callback();
            return;
        }

        fs.readFile(itemPath, (err, data) => {
            if (err) {
                callback(err);
                return;
            }

            var item = JSON.parse(data);
            async.each(item.additionalItemUrls, (additionalItemUrl, cb) => {
                var additionalItemPath = path.join(target, 'pages', additionalItemUrl);
                fs.remove(additionalItemPath, cb);
            }, callback);
        });
    });
}

// save an individual content item
function saveItem(fs, target, content, savePages, saveContentItems, callback) {

    var jsonContent = JSON.stringify(content, null, 4);

    // array of foles to write
    var filesToWrite = [];

    // target directories
    var contentitemsPath = path.join(target, 'contentitems');
    var pagesPath = path.join(target, 'pages', content.url);

    // store JSON files under /contentitems/{UUID}.json
    if (saveContentItems) {
        filesToWrite.push({
            path: path.join(contentitemsPath, content.uuid + '.json'),
            content: jsonContent
        });
    }

    if (savePages) {
        // store JSON under /pages/{url}/ by page url (i.e slug)
        filesToWrite.push({
            path: path.join(pagesPath, 'index.json'),
            content: jsonContent
        });
    }

    // where we create physical content
    async.each(filesToWrite,
        (fileToWrite, cb) => fs.outputFile(fileToWrite.path, fileToWrite.content, cb),
        callback);
}

function cleanup(content, fs, target, cb) {
    var pageFile = path.join(target, 'pages', content.url, 'index.html');
    fs.exists(pageFile, exists => {
        if (exists) {
            fs.unlink(pageFile, cb);
        } else {
            cb();
        }
    });
};

function end(err, app, fs, target, callback) {
    // this cases can be easily moved into site
    // i.e fundinglist can be mouved into mygov
    // special cases:
    // 1. Funding list, 2.pressRelease, 3.pub landing page
    var finalContents = [];

    if (app.context.funding) {
        finalContents.push(app.context.funding.list);
    }

    if (app.context.lists.pressRelease.landing) {
        var min = app.context.lists.pressRelease.minDateTime;
        app.context.lists.pressRelease.landing.contentItem.minDateTime = min;
        finalContents.push(app.context.lists.pressRelease.landing);
    }
    if (app.context.lists.publications.landing) {
        finalContents.push(app.context.lists.publications.landing);
    }

    async.each(finalContents,
        // for each call the handler
        (content, eachCallback) => saveItem(fs, target, content, true, true, eachCallback),
        // called when all are finished
        function() { callback(err); });
}

/**
 * Contains the logic needed to save the files required for a content item.
 **/
module.exports = function(app, target, fs) {

console.log('save-item ', target);
    var contentitemsPath = path.join(target, 'contentitems');

    return {

        // called when the content source is starting
        start: function(callback) {
            // ensure that the pages and content items directories exist
            var pagesDir = path.join(target, 'pages');
            var contentItemsDir = path.join(target, 'contentitems');
            async.series([
                cb => fs.mkdirs(pagesDir, cb),
                cb => fs.mkdirs(contentItemsDir, cb)
            ], callback);
        },

        // called for each content item that has been removed
        removeContentItem: function(context, id, callback) {
            var jsonPath = path.join(contentitemsPath, id + '.json');
            fs.readFile(jsonPath, (err, data) => {
                if (err) {
                    callback();
                    return;
                }
                var content = JSON.parse(data);
                var pagesPath = path.join(target, 'pages', content.url);
                fs.remove(pagesPath, callback);
            });
        },

        // called for each content item provided by the content source
        handleContentItem: function(context, content, callback) {
            handleContentItem(context, content, fs, target, callback);
        },

        // called when the content source will provide no more items
        end: function(err, callback) {
            end(err, app, fs, target, function() {
                app.amphora.utils.downloadQueuedResources(
                    app,
                    function(downloadError) {
                        callback(err || downloadError);
                    });
            });
        }
    };
};
