var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');
var yaml = require('js-yaml');
var yfm = require('yfm');
var async = require('async');
var links = require('../render/links');

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}

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
    var yamlGlob = path.join(this.yamlDir, '**/*.yaml');
    glob(yamlGlob, {}, function (err, files) {
        if (err) {
            done(err);
            return;
        }
        that.indexFiles(files, function(err, index) {
            that.index = index;
            async.eachLimit(files, 4, that.processFile.bind(that), done);
        });
    });
}

Site.prototype.indexFiles = function (files, callback) {
    var that = this;
    var urlById = {};
    var summary = function(file, callback) {
        readFile(file, function(err, item) {
            if (err) {
                callback("Could not read file: " + file);
            } else {
                urlById[item.uuid] = item.url;
                callback();
            }
        });
    };
    async.each(files, summary, function(err) {
        if (!err) {
            callback(null, urlById);
        } else {
            callback(err);
        }
    });
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

function readFile(file, callback) {
    fs.readFile(file, fileOptions, function (err, data) {
        if (err) {
            callback("Could not read file: " + file);
        }
        var item;
        try {
            var data = yfm(data, frontMatterDelimiter);
            item = data.context;
            item.body = data.content;
        } catch (e) {
            callback("Could not parse file: " + file + "\n" + e.message);
        }
        callback(null, item);
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


function shouldRender(item) {
    // Remove first disjunct when resources/doctor has been removed.
    return !item.contentItem._embedded.format._embedded
      || !item.contentItem._embedded.format._embedded.structural;
}

Site.prototype.renderItemToFile = function(item, cb) {
    var context = {
        rewriteLink: links.createRewriter(this.index)
    };
    var html = this.renderer.render(item, context);
    var url = item.url;
    if (!url) {
        throw new Error("Item does not specify a URL.");
    }
    var dir = path.join(this.htmlDir, item.url);
    fs.mkdirs(dir, function() {
        fs.writeFile(path.join(dir, 'index.html'), html, fileOptions, cb);
    });
}

module.exports = {
    Site: Site
}
