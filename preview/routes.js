module.exports = exports = function(referenceDataSource, contentSource, renderer) {

    var config = require('config-weaver').config();
    var fs = require('fs');
    var links = require('../render/links');

    // fetch and savereference data
    var referenceDataFetched = false;

    var handleError = function(res, error) {
        var status = error.status || 400;

        if (error instanceof Error) {
          console.log(error.stack);
        } else {
          console.log(error);
        }

        var item = {
            url: '/error',
            body: 'There was an error',
            title: 'Error',
            contentItem: { summary: 'Error'},
            layout : '_error.hbs',
            statusCode : status,
            message : error
        };
        var html;
        try {
            html = renderer.render(item);
        } catch (e) {
            html = null;
        }
        res.status(status).send(html);
    };

    function render(item, index, res) {
        var context = {
            rewriteLink: links.createRewriter(index)
        };
        try {
          var html = renderer.render(item, context);
          res.status(200).send(html);
        } catch (e) {
            handleError(res, e);
        }
    }

    function fetch(req, res, visibility, callback) {
        // find authorisation token
        // using preview_token as cookie name
        var token = req.query.token || req.cookies.preview_token;
        res.cookie('preview_token', token);
        var auth = {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        };
        try {
          contentSource.fetch(req, auth, visibility, function(error, item) {
              callback(error, item);
          });
        } catch (e) {
          handleError(res, e);
        }
    }

    function ensureReferenceDataPresent(callback) {
      if (referenceDataFetched === false) {
        try {
          referenceDataSource.writeReferenceData(function () {
              referenceDataFetched = true;
              callback();
          });
        } catch (e) {
          console.log('Failed to fetch referenceData');
          console.log(e.stack);
          callback();
        }
      } else {
        callback();
      }
    }

    return {
        preview: function(req, res) {
            ensureReferenceDataPresent( function () {
              var visibility = req.headers['x-visibility'] || 'siteBuild';
              var slug = req.path;
              if (slug !== '/' && fs.existsSync('resources/doctor'+slug)) {
                var filename = 'resources/doctor' + slug + '/index.json';
                var item = JSON.parse(fs.readFileSync(filename, 'utf8'));
                item.config = config;
                item.stagingEnvironment = true;
                render(item, {}, res);
              } else {
                fetch(req, res, visibility, function(error, content) {
                    if (error) {
                        handleError(res, error);
                    } else {
                        var item = content.item;
                        var index = content.index;
                        // Display a banner to warn that this is not the real version of the site.
                        if (visibility === 'factChecking') {
                            item.stagingEnvironment = true;
                        }
                        item.config = config;
                        render(item, index, res);
                    }
                });
              }
            });
        }
    };
};
