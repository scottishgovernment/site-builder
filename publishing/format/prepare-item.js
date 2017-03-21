'use strict';

var links = require('../../render/links');

function collectLinks(context, content, callback) {
    var collector = links.collector();
    try {
        context.app.renderer.render(content, { rewriteLink: collector });
        context.fetchUrlsById(collector.list, function(err, map) {
            content.contentLinks = map || {};
            callback(err, content);
        });
    } catch (e) {
        callback(e, content);
    }
};


function preApply(context, content) {
    // set body for rendering
    content.body = content.contentItem.content;

    content.contentItem.buildTime = JSON.stringify(new Date());

    // assign a page title (meta page title if set, title otherwise)
    var title = content.contentItem.metapagetitle || content.contentItem.title || '';
    content.pagetitle = title.trim();
};

function postApply(context, content, callback) {
    delete context.attributes['page.slug'];
    context.app.amphora.documents(context, content, function() {
        if (context.app.preview) {
            collectLinks(context, content, callback);
        } else {
            callback(null, content);
        }
    });
};

module.exports = function(site) {
    return function(context, content, callback) {
        preApply(context, content);
        var format = site.getFormat(content.contentItem._embedded.format);
        content.layout = format.layout(content);
        if (format.validRequest(context, content)) {
            format.prepareForRender(context, content, function(err, content) {
                if (err) {
                    callback(err);
                } else {
                    postApply(context, content, callback);
                }
            });
        } else {
            callback({ statusCode: 404, message: context.attributes[content.uuid].path });
        }
    };
};
