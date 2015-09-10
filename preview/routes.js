module.exports = exports = function(contentSource, engine) {

    var async = require('async');
    var yamlWriter = require('../build/yaml-writing-content-handler')('out/contentitems');
    var config = require('config-weaver').config();

    var handleError = function(res, error) {
        console.log(error);
        var item = {
            body: 'There was an error',
            layout : '_error.hbs',
            statusCode : 400,
            message : error
        };
        engine.render(item, function(ex, renderedItem) {
            res.status(400).send(renderedItem);
        });
    };

    function render(item, res) {
        engine.render(item, function(error, renderedItem) {
            if (error) {
                handleError(res, error);
            } else {
                res.status(200).send(renderedItem);
            }
        });
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

    return {
        preview: function(req, res) {
            if (req.headers['accept'] && req.headers['accept'].indexOf('image/png') !== -1) {
                screenshot(req, res);
                return;
            }

            var visibility = req.headers['x-visibility'] || 'siteBuild';
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
    };
};
