'use strict';

var http = require('http');
var url = require('url');
var proxy = require('express-http-proxy');

/**
 * Allows a site to define a custom route for a URL path in preview.
 * If the site router returns a URL, preview will use that as an upstream Server
 * and proxy the request to it.
 */
function Router(siteRouter) {
  this.router = siteRouter;
}

Router.prototype.apply = function (req, res, next) {
    var route = this.router(req);
    if (route instanceof url.Url) {
        this.proxy(req, res, route);
    } else {
        next();
    }
};

Router.prototype.proxy = function (request, response, upstream) {
    proxy(upstream.host, {
        forwardPath: function() {
            return upstream.path;
        },
        decorateRequest: function(req) {
            req.agent = false;
        }
    })(request, response);
};

function create(siteRouter) {
    var router = new Router(siteRouter);
    return router.apply.bind(router);
}

module.exports = {
  create: create,
  Router: Router
};
