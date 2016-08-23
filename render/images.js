'use strict';

/**
 * Provides functions used for collecting image links in HTML.
 */

function collector(handleUrl) {
    var urls = {};
    var fn = function (url) {
        var parsedUrl = require('url').parse(url);
        var urlPath = parsedUrl.path;
        urls[urlPath] = handleUrl(urlPath);
    };
    fn.urls = urls;
    return fn;
}

module.exports = {
    collector: collector
};
