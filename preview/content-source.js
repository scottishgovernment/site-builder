var config = require('config-weaver').config();
var path = require('path');
var async = require('async');
var relationships = require('./relationships');
var formatter = require('../publish/item-formatter')(config.layoutstrategy);
var yamlWriter = require('../publish/yaml-writer')('out/contentitems');
var slugify = require('../publish/slugify');
var doctorFormatter = require('../render/doctor-formatter')(config, 'pdfs');
var amphora = require('../render/amphora/amphora')(config);

var policyLatestFormatter = require('../publish/policyLatestFormatter')();
module.exports = function(restler, renderer) {

  function url(source, visibility) {
    var endpoint = config.buildapi.endpoint.replace(/\/$/, '');
    var base = endpoint + '/' + path.join('urlOrId', amphora.getUrl(source));
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
          callback({ status: 404, message: 'Not found: ' + source });
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
  function handleGuide(item, guidePageSlug, callback) {
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

    if (item.contentItem.guidepageslug === undefined) {
      // we do not recognise this guide page - return a 404
      callback({ status: 404, message: 'Not found: ' + req.path});
      return;
    } else {
      // this is a guide page
      callback(null, item);
      return;
    }
  }

  function fetchItem(req, auth, visibility, callback) {
    if (process.previewCache) {
      process.previewCache.context =
          {auth: auth, visibility:visibility, resolve: url, formatter: formatter};
    }
    loadContent(restler, req.path, auth, visibility, function(error, item) {
      if (!error) {
        callback(null, item);
        return;
      }

      // we got an error. If we have a parent then try that
      var route = req.path.split('/').filter(function(x) {
        return x.length;
      });

      // cant be a guide as it does not have enough path elements
      if (route.length <= 1) {
        callback(error);
        return;
      }

      var leaf = route.pop();
      var parentUrl = '/' + route.join('/') + '/';

      // fetch the parent
      loadContent(restler, parentUrl, auth, visibility, function(parentError, parentItem) {

        // we got an error trying to fetch the parent url
        if (parentError) {
          callback(parentError);
          return;
        }

        switch (parentItem.layout) {
          case 'guide.hbs':
            handleGuide(parentItem, leaf, callback);
          break;
          case 'policy.hbs':
            if (config.policylatest.enabled === true) {
              var latestItem = policyLatestFormatter.formatLatest(parentItem);
              callback(null, latestItem);
            } else {
              callback(parentError);
            }
          break;
          default:
            callback(error, null);
        }
      });
    });
  }

  function fetchRelatedItems(item, auth, visibility, callback) {
    var relationship = new relationships.Relationships(renderer);
    var relsToFetch = relationship.find(item);

    // policy details pages need to fetch their siblings...
    if (item.layout === 'policy-detail.hbs') {
       // MGS-1116, policy details might not have a parent (some states)
       if (item.relatedItems.hasParent[0]) {
         var parentId = item.relatedItems.hasParent[0].uuid;
         loadContent(restler, parentId, auth, visibility, function (error, parentItem) {
           parentItem.descendants.forEach(function (child) {
              relsToFetch.push(child);
           });
           writeRelatedItems(relsToFetch, auth, visibility, callback);
         });
       }  else {
           // MGS-1116, showing error message if policy details does not have parent
           callback({
             message: 'Please assign parent to preview this content item (' + item.uuid + ')'
           });
       }
    } else {
      writeRelatedItems(relsToFetch, auth, visibility, callback);
    }
  }

  function writeRelatedItems(itemsToFetch, auth, visibility, callback) {
    var items = {};

    async.each(itemsToFetch,
      function(item, cb) {
        var slug = item.url || item.uuid;

        loadContent(restler, slug, auth, visibility, function(error, item) {
          if (error) {
            cb(error);
          } else {
            items[item.uuid] = item.url;
            yamlWriter.handleContentItem(item, cb);
          }
        });
      },

      function(err) {
        callback(err, items);
      });
  }

  function buildIndex(item, callback) {
    var relationship = new relationships.Relationships(renderer);
    var links = relationship.collectLinks(item).map(function (link) {
      return link.uuid;
    });

    // add the id of this content item
    links.push(item.uuid);

    console.log('collected links:' + JSON.stringify(links));

    var idsParam = links.join(',');
    var fetchIndexUrl = config.publishing.endpoint + 'items/urlsById?ids=' + idsParam;
    restler.get(fetchIndexUrl).on('complete', function(data, response) {
      if (data instanceof Error) {
        callback(data);
        return;
      }

      if (response && response.statusCode !== 200) {
        callback(response);
        return;
      }
      callback(null, JSON.parse(data));
    });
  }

  function postProcess(item, auth, visibility, req, callback) {
    async.series([
        function (cb) {
          // if this is a policy then write out the latest page
          if (item.layout === 'policy.hbs') {
            var latestItem = policyLatestFormatter.formatLatest(item);
            yamlWriter.handleContentItem(latestItem, cb);
          } else {
            cb();
          }
        },

        // fetch related items
        function (cb) {
          fetchRelatedItems(item, auth, visibility, function(err, related) {
            cb(err, related);
          });
        },

        // construct url index for all links in this page
        function (cb) {
          buildIndex(item, cb);
        },

        // write doctor files
        function(cb) {
          doctorFormatter.formatDoctorFiles(item, cb);
        },

        // add amphora details
        function(cb) {
            amphora.handleAmphoraContent(item, function() {
              cb();
            }, amphora.getPageNumber(req.path));
        }
      ],

      function (err, results) {

        console.log('results:' + JSON.stringify(results));
        callback(err, {
          item: item,
          index: results[2]
        });
      }
    );
  }

  return {
    fetch: function(req, auth, visibility, callback) {
      fetchItem(req, auth, visibility, function(err, item) {
        if (err) {
          callback(err);
        } else {
          postProcess(item, auth, visibility, req, callback);
        }
      });
    }
  };
};
