/**
 * Generates HTML for content items by instantiating Handlebars templates.
 */
'use strict';
var path = require('path');
var glob = require('glob');
var fs = require('fs-extra');
var config = require('config-weaver').config();

var frontMatterDelimiter = ['~~~', '~~~'];
var fileOptions = {encoding: 'utf-8'};

function Renderer(layouts, partials, helpers) {
    var marked = require('marked');
    var handlebars = require('handlebars');
    this.handlebars = handlebars;

    this.layoutsDir = layouts;
    /**
     * Compiled templates indexed by name of the layout file.
     */
    this.templates = {};
    var renderer = createRenderer(marked);
    registerPartials(this.handlebars, partials);
    registerHelpers(this.handlebars, helpers);

    // Helper to convert body from markdown to HTML, and render shortcodes.
    handlebars.registerHelper('markdown', function (options) {
        var body = options.fn(this);
        var bodyTemplate = handlebars.compile(body);
        var content = bodyTemplate(this);
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

    this.callbacks = {
        'render': function(src, dst, item) {
            console.log(dst);
        },
    };
}

function createRenderer(marked) {
    var renderer = new marked.Renderer();
    var original = renderer.link;
    renderer.link = function(href, title, text) {
        return original.bind(this)(href, title, text);
    };
    return renderer;
}

function registerPartials(handlebars, dir) {
    var files = fs.readdirSync(dir);
    for (var i = 0; i < files.length; i++) {
        var data = fs.readFileSync(path.join(dir, files[i]), fileOptions);
        var name = files[i].substring(0, files[i].length - 4);
        handlebars.registerPartial(name, data);
    }
}

function registerHelpers(handlebars, dir) {
    var files = glob.sync(path.join(dir, '*.js'));
    for (var i = 0; i < files.length; i++) {
        var helpers = require(files[i]);
        helpers.register(handlebars);
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
}

Renderer.prototype.render = function(item) {
    var renderCallback = this.callbacks.render;
    if (renderCallback) {
        renderCallback(item.uuid, item.url, item.contentItem);
    }
    var format = item.layout;
    if (!format) {
        throw new Error("Item does not specify a layout\n" + JSON.stringify(item, null, 2));
    }
    var template = this.loadTemplate(format);
    item.config = config;
    return template(item);
}

Renderer.prototype.on = function(event, callback) {
  this.callbacks[event] = callback;
}

module.exports = {
    Renderer: Renderer
};
