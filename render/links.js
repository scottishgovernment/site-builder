/**
 * Provides functions used for collecting and rewriting links in Markdown.
 */

var path = require('path');
var url = require('url');
var idRegex = /^[A-Z]+-[0-9]+/;

function createRewriter(index) {
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

function collector() {
    var ids = [];
    var fn = function(href) {
        var match = href.match(idRegex);
        if (match) {
            var id = match[0];
            ids.push({uuid: id});
        }
    };
    fn.ids = ids;
    return fn;
}

module.exports = {
    createRewriter: createRewriter,
    collector: collector
}
