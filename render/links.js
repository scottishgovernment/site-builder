'use strict';

/**
 * Provides functions used for collecting and rewriting links in Markdown.
 */

var path = require('path');
var url = require('url');
var idRegex = /^[A-Z]+-[0-9]+/;

/**
 * Link visitor returns the URL for a content item ID by querying an site index.
 * The index is a map of content item IDs to URLs.
 */
function createRewriter (index) {
    return function(href) {
        var match = href.match(idRegex);
        if (match) {
            var suffix = href.substring(match[0].length);
            var itemUrl = url.parse(index[match[0]] + suffix);
            itemUrl.pathname = path.join(itemUrl.pathname, '/');
            return itemUrl.format();
        }
        return href;
    };
}

/**
 * Link visitor that builds an array of content item IDs referenced by the links.
 */
function collector() {
    var ids = [];
    var list = [];
    var fn = function(href) {
        var match = href.match(idRegex);
        if (match) {
            var id = match[0];
            ids.push({uuid: id});
            list.push(id);
        }
    };
    fn.ids = ids;
    fn.list = list;
    return fn;
}

module.exports = {
    createRewriter: createRewriter,
    collector: collector
};
