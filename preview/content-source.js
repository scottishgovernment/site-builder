var config = require('config-weaver').config();
var path = require('path');
var async = require('async');
var formatter = require('../publish/item-formatter')(config.layoutstrategy);
var yamlWriter = require('../publish/yaml-writing-content-handler')('out/contentitems');

var slugify = require('../publish/slugify');

function url(source, visibility) {
    var endpoint = config.buildapi.endpoint.replace(/\/$/, '');
    var url = endpoint + '/urlOrId' + source + '?visibility=' + visibility;
    return url;
}

/**
* @param source, the contentitem uuid or slug of the contentitem
*/
function loadContent(restler, source, auth, visibility, seen, callback) {
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
        var slug = slugify($(element).text());
        if (slug === guidePageSlug) {
            item.contentItem['guidepage'] = $(element).text();
            item.contentItem['guidepageslug'] = slug;
            return;
        }
    });
}

module.exports = function(restler) {

    function fetchItem(req, auth, visibility, seen, callback) {

        loadContent(restler, req.path, auth, visibility, seen, function(error, item) {
            if (!error) {
                fetchRelatedItems(item, auth, visibility, seen, function (relatederr, relateditems) {
                    callback(error, item);
                });
                return;
            }

            // fetch the parent in order to guidify
            var route = req.path.replace(/\/$/, '').split('/');
            if (route.length > 1) {
                var parentUrl = req.path.substring(0, req.path.indexOf(route[route.length - 1]));

                loadContent(restler, parentUrl, auth, visibility, seen, function(guideError, guideItem) {
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

    function fetchRelatedItems(item, auth, visibility, seen, callback) {
        var relsToFetch = [];
        seen[item.uuid] = item;
        if (item.relatedItems) {
            relsToFetch = relsToFetch.concat(item.relatedItems.hasResponsibleDirectorate);
            relsToFetch = relsToFetch.concat(item.relatedItems.hasSecondaryResponsibleDirectorate);
            relsToFetch = relsToFetch.concat(item.relatedItems.hasResponsibleRole);
            relsToFetch = relsToFetch.concat(item.relatedItems.hasSecondaryResponsibleRole);
            relsToFetch = relsToFetch.concat(item.relatedItems.hasIncumbent);
            relsToFetch = relsToFetch.concat(item.relatedItems.hasOrganisationalRole);
            relsToFetch = relsToFetch.concat(item.relatedItems.hasSecondaryOrganisationalRole);
            relsToFetch = relsToFetch.concat(item.inverseRelatedItems.hasIncumbent);

            // policy detail pages need their parent
            if (item.layout === 'policy-detail.hbs') {
                relsToFetch = relsToFetch.concat(item.relatedItems.hasParent);
            }

            // remove any we have already seen
            relsToFetch = relsToFetch.filter(function (rel) {
                var hasBeenSeen = seen[rel.uuid];
                return !hasBeenSeen;
            });
        }

        async.each(relsToFetch,
            function (rel, cb) {
                var req = { path: rel.url };
                fetchItem(req, auth, visibility, seen, function (error, relItem) {
                    yamlWriter.handleContentItem(relItem, cb);
                });
            },

            function(err) {
                callback(err, item);
            });
    }

    return {
        fetch: function(req, auth, visibility, callback) {
            var seen = {};
            fetchItem(req, auth, visibility, seen, callback);
        }
    };
};
