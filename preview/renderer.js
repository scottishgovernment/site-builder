'use strict';
var links = require('../render/links');

/**
 * Allows a site to define a custom route for a URL path in preview.
 * If the site router returns a URL, preview will use that as an upstream Server
 * and proxy the request to it.
 */
function Router() {

}

function renderError(req, res) {
    var error = req.context.attributes.error;
    var status = error.statusCode || 400;
    var errorResult = {
        url: '/error',
        body: 'There was an error',
        title: 'Error',
        contentItem: { summary: 'Error' },
        layout: '_error.hbs',
        statusCode: status,
        message: {
            message: JSON.stringify(error),
            status: status
        }
    };
    try {
        res.status(status).send(req.context.app.renderer.render(errorResult));
    } catch (e) {
        res.status(status).send(null);
    }
}


function render(req, res) {
    var content = req.context.attributes.content;
    content.config = req.context.app.config;
    try {
        var renderContext = { rewriteLink: links.createRewriter(content.contentLinks) };
        var html = req.context.app.renderer.render(content, renderContext);
        res.status(200).send(html);
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
};

Router.prototype.apply = function(req, res) {
    if (req.context.attributes.error) {
        renderError(req, res);
    } else if (req.context.attributes.content) {
        render(req, res);
    } else {
        res.status(404).send(req.path);
    }
};

function create() {
    var router = new Router();
    return router.apply.bind(router);
}

module.exports = {
    create: create,
    Router: Router
};
