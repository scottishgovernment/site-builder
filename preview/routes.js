module.exports = exports = function(referenceDataSource, contentSource, renderer) {

    var config = require('config-weaver').config();
    var fs = require('fs');

    // fetch and savereference data
    var referenceDataFetched = false;

    var handleError = function(res, error) {
        var status = error.status | 400;
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

    function render(item, res) {
        try {
            var html = renderer.render(item);
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
        contentSource.fetch(req, auth, visibility, function(error, item) {
            callback(error, item);
        });
    }

    function screenshot(req, res) {
        var phantom = require('phantom-render-stream')();
        var extend = require('node.extend');
        var base64 = require('base64-stream');

        var opts = extend({}, req.query);
        var url = 'http://localhost:3000' + req.path;

        if (!req.headers['x-accept-encoding'] || req.headers['x-accept-encoding'] !== 'base64') {
            phantom(url, opts).pipe(res);
        } else {
            phantom(url, opts).pipe(base64.encode()).pipe(res);
        }
    }

    function ensureReferenceDataPresent(callback) {
      if (referenceDataFetched === false) {
        try {
          referenceDataSource.writeReferenceData(function () {
              console.log('Fetched reference Data.');
              referenceDataFetched = true;
              callback();
          });
        } catch (e) {
          console.log('Failed to fetch referenceData');
          callback();
        }
      } else {
        callback();
      }
    }

    return {
        preview: function(req, res) {

            ensureReferenceDataPresent( function () {
              if (req.headers['accept'] && req.headers['accept'].indexOf('image/png') !== -1) {
                  screenshot(req, res);
                  return;
              }

              var visibility = req.headers['x-visibility'] || 'siteBuild';

              var slug = req.path;
              if ( slug != '/' && fs.existsSync('resources/doctor'+slug)){
                var filename = 'resources/doctor'+slug+'/index.json';
                var item = JSON.parse(fs.readFileSync(filename, 'utf8'));
                item.config = config;
                item.stagingEnvironment = true;
                render(item, res);
              } else {
                fetch(req, res, visibility, function(error, item) {
                    if (error) {
                        handleError(res, error);
                    } else {
                        // Display a banner to warn that this is not the real version of the site.
                        if (visibility === 'factChecking') {
                            item.stagingEnvironment = true;
                        }
                        item.config = config;
                        render(item, res);
                    }
                });
              }
            });
        }
    };
};
