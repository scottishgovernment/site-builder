'use strict';

var async = require('async');
var path = require('path');
var glob = require('glob');

var indexerFilter = require('./indexer/filter');
var indexerFormatter = require('./indexer/formatter');

function handleContentItem(context, content, fs, target, callback) {
    cleanup(content, fs, target, function() {
        createJson(context, content, fs, target, callback);
    });
};

function indexableFilename(target, item) {
    var filename = item.uuid
        + '.'
        + item.contentItem._embedded.format.name.toLowerCase()
        + '.json';
    return path.join(target, 'indexable', filename);
}

function createJson(context, content, fs, target, callback) {

    content.additionalItemUrls = [];
    var savePages = context.attributes[content.uuid].store;
    if (!context.attributes[content.uuid].additionalItems) {
        saveItem(fs, target, content, context, savePages, true, callback);
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

                    saveItem(fs, target, item, context, savePages, false, cb);
                    index++;
                },
                () => saveItem(fs, target, content, context, savePages, true, callback));
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

function getCategoryForItem(item) {
    var category = 'root';
    if (item.ancestors && item.ancestors.length > 1 ) {
        var ancestorUrl = item.ancestors[1].url;
        category = ancestorUrl.replace(/\//g, '');
    }
    return category;
}

// save an individual content item
function saveItem(fs, target, content, context, savePages, saveContentItems, callback) {

    var jsonContent = JSON.stringify(content, null, 4);

    // array of foles to write
    var filesToWrite = [];

    // target directories
    var contentitemPath = path.join(target, 'contentitems', content.uuid + '.json');
    var pagePath = path.join(target, 'pages', content.url, 'index.json');

    // store JSON files under /contentitems/{UUID}.json
    if (saveContentItems) {
        filesToWrite.push({
            path: contentitemPath,
            content: jsonContent
        });
    }

    var format = content.contentItem._embedded.format;
    var includeInSitemap =
        savePages &&
        format._embedded.structural === false &&
        format.name !== 'STATUS';

    if (includeInSitemap) {
        context.sitemapData[content.uuid] = {
            url: content.url,
            category: getCategoryForItem(content),
            lastmod: content.contentItem.dateModified
                ? content.contentItem.dateModified : content.contentItem.dateCreated
        };
    }

    if (savePages) {
        // store JSON under /pages/{url}/ by page url
        filesToWrite.push({
            path: pagePath,
            content: jsonContent
        });
    }

    // save a cut down file for search indexing
    if (saveContentItems && indexerFilter.accept(content)) {
        var dir = path.join(target, 'contentitems');
        indexerFormatter.format(content, dir,
            formattedItem => {
                var indexablePath = indexableFilename(target, content);
                filesToWrite.push({
                    path: indexablePath,
                    content: JSON.stringify(formattedItem)
                });
            writeFiles(fs, filesToWrite, callback);
        });
    } else {
        writeFiles(fs, filesToWrite, callback);
    }
}

function writeFiles(fs, filesToWrite, callback) {
    async.each(filesToWrite,
        (fileToWrite, cb) => fs.outputFile(fileToWrite.path, fileToWrite.content, cb),
        callback);
}


function cleanup(content, fs, target, cb) {
    var indexableFilesSpec = path.join(target, 'indexable', content.uuid + '.*.json');
    // delete any indexable files for this id.  This is to fix the case where a content item
    // changes its formaat.
    glob(indexableFilesSpec, (globErr, files) => {

        if (globErr) {
            cb(globErr);
            return;
        }
        async.each(files, fs.unlink, () => {
            // now delete the page file
            var pageFile = path.join(target, 'pages', content.url, 'index.html');
            fs.exists(pageFile, exists => {
                if (exists) {
                    fs.unlink(pageFile, cb);
                } else {
                    cb();
                }
            });
        });
    });
};

/**
 * Contains the logic needed to save the files required for a content item.
 **/
module.exports = function(app, target, fs) {

    var pagesDir = path.join(target, 'pages');
    var contentItemsDir = path.join(target, 'contentitems');
    var indexableDir = path.join(target, 'indexable');

    return {

        // called when the content source is starting
        start: function(callback) {
            // ensure that the pages and content items directories exist
            async.series([
                cb => fs.mkdirs(pagesDir, cb),
                cb => fs.mkdirs(contentItemsDir, cb),
                cb => fs.mkdirs(indexableDir, cb)
            ], callback);
        },

        // called for each content item that has been removed
        removeContentItem: function(context, id, callback) {
            var jsonPath = path.join(contentItemsDir, id + '.json');
            fs.readFile(jsonPath, (err, data) => {
                if (err) {
                    callback();
                    return;
                }
                var content = JSON.parse(data);
                var pagesPath = path.join(pagesDir, content.url);
                var indexablePath = indexableFilename(target, content);

                // delete the json file and corresponding page directory
                async.series([
                    cb => fs.remove(pagesPath, cb),
                    cb => fs.remove(jsonPath, cb),
                    cb => fs.remove(indexablePath, cb)
                  ], callback);
            });
        },

        // called for each content item provided by the content source
        handleContentItem: function(context, content, callback) {
            handleContentItem(context, content, fs, target, callback);
        },

        // called when the content source will provide no more items
        end: function(err, callback) {
            app.amphora.utils.downloadQueuedResources(
                app,
                function(downloadError) {
                    callback(err || downloadError);
                });
        }
    };
};
