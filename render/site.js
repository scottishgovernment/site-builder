var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');
var yaml = require('js-yaml');
var yfm = require('yfm');
var async = require('async');

var frontMatterDelimiter = ['~~~', '~~~'];
var fileOptions = {encoding: 'utf-8'};

var layoutsDir;

function Site(yamlDir, htmlDir, renderer) {
    this.yamlDir = yamlDir;
    this.htmlDir = htmlDir;
    this.renderer = renderer;
}

Site.prototype.build = function(done) {
    var that = this;
    var yamlGlob = path.join(this.yamlDir, '*.yaml');
    glob(yamlGlob, {}, function (err, files) {
        if (err) {
            done(err);
        } else {
            async.eachLimit(files, 4, that.processFile.bind(that), done);
        }
    });
}

Site.prototype.renderItemToFile = function(item, cb) {
    var html = this.renderer.render(item);
    var url = item.url;
    if (!url) {
        throw new Error("Item does not specify a URL.");
    }
    var dir = path.join(this.htmlDir, item.url);
    fs.mkdirs(dir, function() {
        fs.writeFile(path.join(dir, 'index.html'), html, fileOptions, cb);
    });
}

Site.prototype.renderYamlToFile = function(data, cb) {
    var data = yfm(data, frontMatterDelimiter);
    var item = data.context;
    var dst = item.url;
    item.body = data.content;
    try {
        if (shouldRender(item)) {
            this.renderItemToFile(item, cb);
        } else {
            cb();
        }
    } catch (e) {
        e.message = "Failed on item: " + item.uuid + "\n" + e.message;
        throw e;
    }
}

Site.prototype.processFile = function(src, cb) {
    var that = this;
    fs.readFile(src, fileOptions, function (err, data) {
        if (!err) {
            that.renderYamlToFile(data, cb);
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

module.exports = {
    Site: Site
}
