/**
 * Generates HTML for content items by instantiating Handlebars templates.
 */
'use strict';
var marked = require('marked');
var path = require('path');
var glob = require('glob');
var fs = require('fs-extra');
var config = require('config-weaver').config();

var fileOptions = {encoding: 'utf-8'};

function Renderer(layouts, partials, helpers, tempDir) {
    this.layoutsDir = layouts;
    this.partials = partials;
    this.helpers = helpers;
    this.tempDir = tempDir;
    this.reload();

    this.callbacks = {
        'render': function(src, dst) {
            console.log(dst);
        }
    };
}

Renderer.prototype.reload = function() {
    var that = this;
    var handlebars = require('handlebars').create();
    this.handlebars = handlebars;
    this.templates = {};
    registerPartials(this.handlebars, this.partials);
    registerHelpers(this.handlebars, this.helpers, this.tempDir);

    // Helper to convert body from markdown to HTML, and render shortcodes.
    handlebars.registerHelper('markdown', function (options) {
        var body = options.fn(this);
        var bodyTemplate = handlebars.compile(body);
        var content = bodyTemplate(this);
        var renderer = that.createRenderer(options.data.root.rewriteLink);
        var html = marked(content, { renderer: renderer });
        return new handlebars.SafeString(html);
    });

    // Helper to expand shortcodes in the body.
    // Used for guides, because the helpers convert from markdown,
    // but they don't render shortcodes.
    handlebars.registerHelper('shortcodes', function (options) {
        var body = options.fn(this);
        var bodyTemplate = handlebars.compile(body);
        var content = bodyTemplate(this);
        return new handlebars.SafeString(content);
    });

    // Helper to output a responsive image tag and collect the image links
    handlebars.registerHelper('img', function (options) {
        var linkFn = options.data.root.imageLink;

        // record all of the img urls
        if (options.hash.src) {
            linkFn(options.hash.src);
        }

        if (options.hash.srcset) {
            options.hash.srcset.split(',').forEach(function (part) {
                var imgUrl = part.trim().split(/(\s+)/)[0];
                linkFn(imgUrl);
            });
        }

        var attribs = [];
        for (var property in options.hash) {
            if (options.hash.hasOwnProperty(property)) {
                attribs.push(property + '="' + options.hash[property] + '"');
            }
        }
        return new handlebars.SafeString('<img ' + attribs.join(' ') + '/>');
    });

};

Renderer.prototype.createRenderer = function (rewriteLink) {
    var renderer = new marked.Renderer();
    if (rewriteLink) {
        var original = renderer.link;
        renderer.link = function(link, title, text) {
            var href = rewriteLink(link, title, text);
            return original.bind(this)(href, title, text);
        };
    }
    return renderer;
};

function registerPartials(handlebars, dir) {
    var files = fs.readdirSync(dir);
    for (var i = 0; i < files.length; i++) {
        var data = fs.readFileSync(path.join(dir, files[i]), fileOptions);
        var name = files[i].substring(0, files[i].length - 4);
        handlebars.registerPartial(name, data);
    }
}

function registerHelpers(handlebars, dir, tempDir) {
    var files = glob.sync(path.join(dir, '*.js'));
    for (var i = 0; i < files.length; i++) {
        var helpers = require(files[i]);
        if (helpers.register) {
            helpers.register(handlebars, tempDir);
        }
    }
}

/**
 * Returns the given layout as a template, loading it if necessary.
 */
Renderer.prototype.loadTemplate = function(format) {
    var template = this.templates[format];
    if (!template) {
        var file = path.join(this.layoutsDir, format);
        var layout = fs.readFileSync(file, fileOptions);
        template = this.handlebars.compile(layout);
        this.templates[format] = template;
    }
    return template;
};

Renderer.prototype.render = function(item, options) {
    var renderCallback = this.callbacks.render;
    if (renderCallback) {
        renderCallback(item.uuid, item.url, item.contentItem);
    }
    var format = item.layout;
    if (!format) {
        var itemJson = JSON.stringify(item, null, 2);
        throw new Error('Item does not specify a layout\n' + itemJson);
    }
    var template = this.loadTemplate(format);
    options = options || {};
    item.rewriteLink = options.rewriteLink;
    item.imageLink = options.imageLink || new Function();
    item.config = config;
    return template(item);
};

Renderer.prototype.on = function(event, callback) {
  this.callbacks[event] = callback;
};

module.exports = {
    Renderer: Renderer
};
