'use strict';

/**
 * Provides functions used for collecting image links in HTML.
 */

function collector(handleUrl) {
    var urls = {};
    var fn = function (url) {
        urls[url] = handleUrl(url);
    };
    fn.urls = urls;
    return fn;
}

module.exports = {
    collector: collector
};
