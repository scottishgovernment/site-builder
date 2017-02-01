'use strict';

var url = require('url');
var proxy = require('express-http-proxy');


/**
 * Allows a site to define a custom route for a URL path in preview.
 * If the site router returns a URL, preview will use that as an upstream Server
 * and proxy the request to it.
 */
function Router(siteRouter, app) {
    this.router = siteRouter;
    this.router.app = app;
}

function createContext(router, req, res) {
    var visibility = req.headers['x-visibility'] || 'preview';
    var token = null;
    if (res) {
        token = req.query.token || req.cookies.preview_token;
        res.cookie('preview_token', token);
    }
    return router.app.createPrepareContext(visibility, token);
}


Router.prototype.apply = function(req, res, next) {
    if (this.router.app) {
        req.context = createContext(this.router, req, res);
    }
    this.router(req, (route) => {
        if (route instanceof url.Url) {
            this.proxy(req, res, route);
        } else {
            next();
        }
    });
};

Router.prototype.proxy = function(request, response, upstream) {
    proxy(upstream.host, {
        forwardPath: function() {
            return upstream.path;
        },
        decorateRequest: function(req) {
            req.agent = false;
        }
    })(request, response);
};

function create(siteRouter, app) {
    var router = new Router(siteRouter, app);
    return router.apply.bind(router);
}

module.exports = {
    create: create,
    Router: Router
};
