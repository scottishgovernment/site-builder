/**
 * Provides functions used for collecting and rewriting links in Markdown.
 */

var path = require('path');

var idRegex = /^[A-Z]+-[0-9]+/;

function createRewriter(index) {
    return function(href) {
        var match = href.match(idRegex);
        if (match) {
            var itemUrl = index[match[0]];
            var suffix = href.substring(match[0].length);
            return path.join(itemUrl, suffix, '/');
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
