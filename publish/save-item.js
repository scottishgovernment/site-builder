'use strict';

var async = require('async');
var path = require('path');
var yaml = require('js-yaml');

function init(fs, target, callback) {
    fs.removeSync(path.join(target, 'pages'));
    fs.removeSync(path.join(target, 'contentitems'));
    fs.mkdirsSync(path.join(target, 'pages'));
    fs.mkdirsSync(path.join(target, 'contentitems'));
    callback();
};

function handleContentItem(context, content, fs, target, callback) {
    var publish = context.attributes[content.uuid].store;
    if (context.attributes[content.uuid].additionalItems) {
        context.attributes[content.uuid].additionalItems.each(function(item, cb) {
            saveItem(fs, target, item, publish, cb);
        }, function() {
            saveItem(fs, target, content, publish, callback);
        });
    } else {
        saveItem(fs, target, content, publish, callback);
    }
};

// Turn a content item into yaml frontmatter
function toYaml(content) {
    return '~~~\n' + yaml.dump(content) + '~~~\n' + content.contentItem.content;
};

// save an individual content item
function saveItem(fs, target, content, publish, callback) {
    var yamlContent = toYaml(content);
    var jsonContent = JSON.stringify(content, null, 4);

    // array of foles to write
    var filesToWrite = [];

    // target directories
    var contentitemsPath = path.join(target, 'contentitems');
    var pagesPath = path.join(target, 'pages', content.url);

    // store YAML and JSON files under /contentitems/{UUID}.yaml and /contentitems/{UUID}.json
    filesToWrite.push({
        path: path.join(contentitemsPath, content.uuid + '.yaml'),
        content: yamlContent
    });
    filesToWrite.push({
        path: path.join(contentitemsPath, content.uuid + '.json'),
        content: jsonContent
    });


    if (publish) {
        // store YAML and JSON under /pages/{url}/ by page url (i.e slug)
        filesToWrite.push({
            path: path.join(pagesPath, 'index.yaml'),
            content: yamlContent
        });
        filesToWrite.push({
            path: path.join(pagesPath, 'index.json'),
            content: jsonContent
        });
    }

    // where we create physical content
    async.each(filesToWrite,
        function(fileToWrite, cb) {
            fs.outputFile(fileToWrite.path, fileToWrite.content, cb);
        },
        callback);
};

var finalize = function(fs, err, app, target, callback) {
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
        function(content, eachCallback) {
            saveItem(fs, target, content, true, eachCallback);
        },
        // called when all are finished
        function() {
            callback(err);
        });
};

/**
 * Contains the logic needed to save the files required for a content item.
 **/
module.exports = function(app, target, fs) {

    return {

        // called when the content source is starting
        start: function(callback) {
            init(fs, target, callback);
        },

        // called for each content item provided by the content source
        handleContentItem: function(context, content, callback) {
            handleContentItem(context, content, fs, target, callback);
        },

        // called when the content source will provide no more items
        end: function(err, callback) {
            finalize(fs, err, app, target, function(error) {
                app.amphora.utils.downloadQueuedResources(
                    app,
                    function(downloadError) {
                        callback((err || error) || downloadError);
                    });
            });
        }
    };
};