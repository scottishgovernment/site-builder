var config = require('config-weaver').config();
var path = require('path');
var formatter = require('../build/item-formatter')();

function url(source, visibility) {
    var endpoint = config.buildapi.endpoint.replace(/\/$/, '');
    var url = endpoint + '/' + source + '?visibility=' + visibility;
    return url;
}

/**
* @param source, the contentitem uuid or slug of the contentitem
*/
function loadContent(restler, source, auth, visibility, callback) {
    var contentUrl = url(source, visibility);
    restler.get(contentUrl, auth).on('complete', function(data, response) {
        if (data instanceof Error || (response && response.statusCode !== 200)) {
            var error = {
                status: response ? response.statusCode : 500,
                message: 'Failed to fetch item: ' + source + ' ' + data
            };
            callback(error);
        } else {
            var item = formatter.format(JSON.parse(data));
            item.body = item.contentItem.content;
            callback(null, item);
        }
    });
}

/**
 * @param item, the actual guide content
 * @param guidePageSlug, the leaf slug, which is presumably the guide page (sub guide item)
 */

function guidify(item, guidePageSlug) {
    var html = require('marked')(item.contentItem.content);
    var $ = require('cheerio').load(html);
    // iterate guide headers
    // if header matches the leaf
    // enrich item with guidepage/guidepageslug fields and return
    // handlebars helper will deal with the presentation
    $('h1').each(function(index, element) {
        var slug = $(element).text().toLowerCase().replace(/[^\w]+/g, '-');
        if (slug === guidePageSlug) {
            item.contentItem['guidepage'] = $(element).text();
            item.contentItem['guidepageslug'] = slug;
            return;
        }
    });
}

module.exports = function(restler) {
    return {
        fetch: function(path, auth, visibility, callback) {
            if (path.parent) {
                loadContent(restler, path.parent, auth, visibility, function(error, item) {
                    if (error) {
                        callback(error);
                    } else {
                        if (item.layout === 'guide.hbs') {
                            // prepare guide page to serve
                            guidify(item, path.leaf);
                            callback(null, item);
                        } else {
                            loadContent(restler, path.leaf, auth, visibility, function(error, item) {
                                if (error) {
                                    callback(error);
                                } else {
                                    callback(null, item);
                                }
                            });
                        }
                    }
                });
            } else {
                loadContent(restler, path.leaf, auth, visibility, function(error, item) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, item);
                    }
                });
            }
        }
    };
};
