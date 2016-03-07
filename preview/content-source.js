var config = require('config-weaver').config();
var path = require('path');
var async = require('async');
var relationships = require('./relationships');
var formatter = require('../publish/item-formatter')(config.layoutstrategy);
var yamlWriter = require('../publish/yaml-writer')('out/contentitems');
var slugify = require('../publish/slugify');
var doctorFormatter = require('../render/doctor-formatter')(config, 'pdfs');

module.exports = function(restler, renderer) {

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

  function fetchItem(req, auth, visibility, callback) {
    loadContent(restler, req.path, auth, visibility, function(error, item) {
      if (!error) {
        callback(null, item);
        return;
      }
      // we got an error. Check if the parent is a guide or not.
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
      loadContent(restler, parentUrl, auth, visibility, function(guideError, guideItem) {

        // we got an error trying to fetch the parent url
        if (guideError) {
          callback(guideError);
          return;
        }

        // we fetch the parent but it is not a guide.
        if (guideItem.layout !== 'guide.hbs') {
          callback(error, null);
          return;
        }

        // make sure that we found the item we are looking for
        guidify(guideItem, leaf);

        if (guideItem.contentItem.guidepageslug === undefined) {
          // we do not recognise this guide page - return a 404
          callback({ status: 404, message: 'Not found: ' + req.path});
          return;
        } else {
          // this is a guide page
          callback(null, guideItem);
          return;
        }
      });
    });
  }

  function fetchRelatedItems(item, auth, visibility, callback) {
    var relationship = new relationships.Relationships(renderer);
    var relsToFetch = relationship.find(item);
    var items = {};
    async.each(relsToFetch,
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

  function postProcess(item, auth, visibility, callback) {
    async.series([
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
        }
      ],

      function (err, results) {
        callback(err, {
          item: item,
          index: results[1]
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
          postProcess(item, auth, visibility, callback);
        }
      });
    }
  };
};
