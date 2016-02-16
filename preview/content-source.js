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
            callback(error);
        } else {
            var item = formatter.format(JSON.parse(data));
            item.body = item.contentItem.content;

            // if the item is structural then return a 404
            if (item.contentItem._embedded.format._embedded.structural === true) {
              var error = {
                  status: 404,
                  message: 'Not found: ' + source
              };
              callback(error);
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

module.exports = function(restler, renderer) {

    function fetchItem(req, auth, visibility, callback) {
        loadContent(restler, req.path, auth, visibility, function(error, item) {
            if (!error) {
                fetchRelatedItems(item, auth, visibility, function (err, related) {
                    callback(err, { item: item, index: related });
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

                        // make sure that we foind the item we are loking for
                        if (guideItem.contentItem.guidepageslug === undefined) {
                          // we do not recognise this guide page - return a 404
                          var error = {
                              status: 404,
                              message: 'Not found: ' + req.path
                          };
                          callback(error);
                        } else {
                            fetchRelatedItems(guideItem, auth, visibility, function (err, related) {
                            if (!err) {
                                callback(null, { item: guideItem, index: related });
                            } else {
                                callback(err);
                            }
                        });
                      }
                    } else {
                      // if it is not a guide then return the original error
                      callback(error);
                    }
                });
            } else {
              callback(error);
            }

        });
    }

    function fetchRelatedItems(item, auth, visibility, callback) {
        var relationship = new relationships.Relationships(renderer);
        var relsToFetch = relationship.find(item);
        var items = {};
        async.each(relsToFetch,
            function (item, cb) {
                var slug = item.url || item.uuid;
                loadContent(restler, slug, auth, visibility, function(error, item) {
                    if (error) {
                        cb(error);
                    } else {
                        items[item.uuid] = item;
                        yamlWriter.handleContentItem(item, cb);
                    }
                });
            },

            function (err) {
                callback(err, items);
            });
    }

    return {
        fetch: function(req, auth, visibility, callback) {
            fetchItem(req, auth, visibility, callback);
        }
    };
};
