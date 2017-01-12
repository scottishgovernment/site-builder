
'use strict';

var path = require('path');
var fs = require('fs');
var fileOptions = {encoding: 'utf-8'};

/**
 * Formatter applied to all content items before they are indexed.
 **/
function format(item, srcdir, callback) {
    var formatted = JSON.parse(JSON.stringify(item.contentItem));

    redactLinks(formatted);

    var fieldsToPromote = ['url', 'filterDate', 'label'];
    fieldsToPromote.forEach(function (field) {
        formatted[field] = item[field];
    });
    formatted._embedded.format.name = item.contentItem._embedded.format.name.toLowerCase();

    // add fields needed for autocomplete
    formatted.autocomplete = {
        input: formatted.title
    };

    formatTopics(formatted);

    if (formatted._embedded.format.name === 'role' ||
        formatted._embedded.format.name === 'featured_role') {
        enrichRoleWithPersonData(item, formatted, srcdir, callback);
    } else {
        callback(formatted);
    }
}

function redactLinks (o) {
    delete o.links;
    for (var i in o) {
        if (o[i] !== null && typeof o[i] === 'object') {
            redactLinks(o[i]);
        }
    }
}

function formatTopics(item) {
    // create an array of topic names
    item.topicNames = [];
    if (item._embedded.topics) {
        item._embedded.topics.forEach(function (t) {
            item.topicNames.push(t.name);
        });
    }
}

function enrichRoleWithPersonData(item, formatted, srcdir, callback) {
    if (item.relatedItems.hasIncumbent.length === 0) {
        // no incumbent to enrich with
        callback(formatted);
        return;
    }

    var incumbentFilename = path.resolve(srcdir, item.relatedItems.hasIncumbent[0].uuid + '.json');

    fs.readFile(incumbentFilename, fileOptions, function (err, data) {
        if (err) {
         callback(err);
         return;
        }

        var incumbent = JSON.parse(data);

        // copy all content fields into the role content item
        ['content', 'additionalContent'].forEach(
            function (field) {
                formatted[field] = [item.contentItem[field], incumbent.contentItem[field]].join('\n');
            });

        // copy the title to incumbentTitle
        formatted['incumbentTitle'] = incumbent.contentItem.title;

        // copy the incumbent image
        formatted['image'] = incumbent.contentItem.image;

        // append the incumbent tags to the role tags
        incumbent.contentItem.tags.forEach(function (tag) {
            formatted.tags.push(tag);
        });

        callback(formatted);
    });
}

module.exports = {
    format : format
};
