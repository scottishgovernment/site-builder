/**
 * Generates HTML for content items by instantiating Handlebars templates.
 */
'use strict';
var path = require('path');
var fs = require('fs-extra');
var hb = require('handlebars');
var marked = require('marked');
var glob = require('glob');
var yaml = require('js-yaml');
var yfm = require('yfm');
var async = require('async');
var config = require('config-weaver').config();

var frontMatterDelimiter = ['~~~', '~~~'];
var fileOptions = {encoding: 'utf-8'};

var layoutsDir;

/**
 * Compiled templates indexed by name of the layout file.
 */
var templates = {};

var callbacks = {
    'render': function(src, dst, item) {
        console.log(dst);
    },
};

function init(layouts, partials, helpers) {
    layoutsDir = layouts;
    templates = {};
    var renderer = createRenderer();
    registerPartials(hb, partials);
    registerHelpers(hb, helpers);

    // Helper to convert body from markdown to HTML, and render shortcodes.
    hb.registerHelper('markdown', function (options) {
        var body = options.fn(this);
        var bodyTemplate = hb.compile(body);
        var content = bodyTemplate(this);
        var html = marked(content, { renderer: renderer });
        return new hb.SafeString(html);
    });

    // Helper to expand shortcodes in the body.
    // Used for guides, because the helpers convert from markdown,
    // but they don't render shortcodes.
    hb.registerHelper('shortcodes', function (options) {
        var body = options.fn(this);
        var bodyTemplate = hb.compile(body);
        var content = bodyTemplate(this);
        return new hb.SafeString(content);
    });

}

function createRenderer() {
    var renderer = new marked.Renderer();
    renderer.link_original = marked.Renderer.prototype.link;
    renderer.link = function(href, title, text) {
        return this.link_original(href, title, text);
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
function loadTemplate(format) {
    var template = templates[format];
    if (!template) {
        var file = path.join(layoutsDir, format);
        var layout = fs.readFileSync(file, fileOptions);
        template = hb.compile(layout);
        templates[format] = template;
    }
    return template;
}

function render(item) {
    var renderCallback = callbacks.render;
    if (renderCallback) {
        renderCallback(item.uuid, item.url, item.contentItem);
    }
    var template = loadTemplate(item.layout);
    item.config = config;
    return template(item);
}

function renderItemToFile(item, cb) {
    var html = render(item);
    var dir = path.join('out/pages', item.url);
    fs.mkdirs(dir, function() {
        fs.writeFile(path.join(dir, 'index.html'), html, fileOptions, cb);
    });
}

function renderYamlToFile(data, cb) {
    var data = yfm(data, frontMatterDelimiter);
    var item = data.context;
    var dst = item.url;
    item.body = data.content;
    try {
        if (shouldRender(item)) {
            renderItemToFile(item, cb);
        } else {
            cb();
        }
    } catch (e) {
        e.message = "Failed on item: " + item.uuid + "\n" + e.message;
        throw e;
    }
}

function processFile(src, cb) {
    fs.readFile(src, fileOptions, function (err, data) {
        if (!err) {
            renderYamlToFile(data, cb);
        } else {
            cb(err);
        }
    });
}

function shouldRender(item) {
    // Remove first disjunct when resources/doctor has been removed.
    return !item.contentItem._embedded.format._embedded
      || !item.contentItem._embedded.format._embedded.structural;
}

function run(cb) {
    glob("out/contentitems/*.yaml", {}, function (err, files) {
        if (err) {
            cb(err);
        } else {
            async.eachLimit(files, 4, processFile, cb);
        }
    });
}

function on(event, callback) {
  callbacks[event] = callback;
}

module.exports = {
    handlebars: hb,
    init: init,
    render: render,
    run: run,
    on: on,
};
