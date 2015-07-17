module.exports = exports = function(contentSource, engine) {

    var handleError = function(res, error) {
        console.log(error);
        var item = {
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

    function getPath(req) {
        // Remove trailing '/' if present.
        var route = req.path.replace(/\/$/, '').split('/');

        // leaf is used for retrieving item, it can be either id or slug (asuming slug is unique, which may not)
        // parent is previous item on the full slug
        // if leaf can not be found
        // parent is loaded and checked whether is guide, if it is guide, leaf is used to serve specific guide page
        // and parent is used to retrive guide
        // url and route is for descritpion only, they are currently not used by content source,
        // only leaf and parent (when content not found) is used
        return {
            url: req.path,
            route: route,
            leaf: route[route.length - 1] ? route[route.length - 1] : '/home',
            parent: route.length > 1 ? route[route.length - 2] : ''
        };
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


        contentSource.fetch(getPath(req), auth, visibility, function(error, item) {
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
                    render(item, res);
                }
            });
        }
    };
};
