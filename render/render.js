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
var templates = {};
var callbacks = {
    'render': function(src, dst, item) {
        console.log(dst);
    },
};

function init(layouts, partials, helpers) {
    layoutsDir = layouts;
    templates = {};
    registerPartials(hb, partials);
    registerHelpers(hb, helpers);

    hb.registerHelper('markdown', function (options) {
        var body = options.fn(this);
        var bodyTemplate = hb.compile(body);
        var content = bodyTemplate(this);
        var html = marked(content);
        return new hb.SafeString(html);
    });

    hb.registerHelper('shortcodes', function (options) {
        var body = options.fn(this);
        var bodyTemplate = hb.compile(body);
        var content = bodyTemplate(this);
        return new hb.SafeString(content);
    });

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
    var template = loadTemplate(item.layout);
    item.config = config;
    return template(item);
}

function renderFile(src, dst, cb) {
    var renderCallback = callbacks.render;
    fs.readFile(src, fileOptions, function (err, data) {
        if (!err) {
            var data = yfm(data, frontMatterDelimiter);
            if (renderCallback) {
                renderCallback(src, dst, data.context.contentItem);
            }
            var item = data.context;
            item.body = data.content;
            var html = render(item);
            fs.mkdirsSync(path.dirname(dst));
            fs.writeFileSync(dst, html, fileOptions);
            cb();
        } else {
            cb(err);
        }
    });
}

function processYamlFile(src, cb) {
    var dest = src.replace('out/contentitems/', 'out/pages/')
                   .replace(/.yaml$/, '.html')
    renderFile(src, dest, cb);
}

function run(cb) {
    glob("out/contentitems/**/*.yaml", {}, function (err, files) {
        if (err) {
            console.log(err);
            cb(err);
        } else {
            async.eachSeries(files, processYamlFile, function(err) {
                cb(err);
            });
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
