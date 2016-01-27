var config = require('config-weaver').config();
var path = require('path');
var async = require('async');
var relationships = require('./relationships');
var formatter = require('../publish/item-formatter')(config.layoutstrategy);
var yamlWriter = require('../publish/yaml-writer')('out/contentitems');

var slugify = require('../publish/slugify');

function url(source, visibility) {
    var endpoint = config.buildapi.endpoint.replace(/\/$/, '');
    var base = endpoint + '/' + path.join('urlOrId', source);
    return base + '?visibility=' + visibility;
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
            callback(error, null);
        } else {
            var item = formatter.format(JSON.parse(data));
            item.body = item.contentItem.content;

            // if the item is structural then return a 404
            if (item.contentItem._embedded.format._embedded.structural === true) {
              var error = {
                  status: 404,
                  message: 'Not found: ' + source
              };
              callback(error, null);
            } else {
              callback(null, item);
            }
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
        var slug = slugify($(element).text());
        if (slug === guidePageSlug) {
            item.contentItem['guidepage'] = $(element).text();
            item.contentItem['guidepageslug'] = slug;
            return;
        }
    });
}

module.exports = function(restler) {

    function fetchItem(req, auth, visibility, callback) {
        loadContent(restler, req.path, auth, visibility, function(error, item) {
            if (!error) {
                fetchRelatedItems(item, auth, visibility, function (relatederr, relateditems) {
                    callback(error, item);
                });
                return;
            }

            // fetch the parent in order to guidify
            var route = req.path.split('/').filter(function(x) { return x.length });
            if (route.length > 1) {
                var parentUrl = req.path.substring(0, req.path.indexOf(route[route.length - 1]));
                loadContent(restler, parentUrl, auth, visibility, function(guideError, guideItem) {
                    if (guideError) {
                        callback(guideError);
                        return;
                    }
                    if (guideItem.layout === 'guide.hbs') {
                        var leaf = route[route.length - 1];
                        guidify(guideItem, leaf);
                        callback(null, guideItem);
                    } else {
                      // if it is not a guide then return the original error
                      callback(error);
                    }
                });
            } else {
              callback(error, item);
            }

        });
    }

    function fetchRelatedItems(item, auth, visibility, callback) {
        var relationship = new relationships.Relationships();
        var relsToFetch = relationship.find(item);
        async.each(relsToFetch,
            function (item, cb) {
                var req = { path: item.url || item.uuid };
                fetchItem(req, auth, visibility, function (error, relItem) {
                    yamlWriter.handleContentItem(relItem, cb);
                });
            },

            function (err) {
                callback(err, item);
            });
    }

    return {
        fetch: function(req, auth, visibility, callback) {
            fetchItem(req, auth, visibility, callback);
        }
    };
};
