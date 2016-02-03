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

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number'
          || !isFinite(position)
          || Math.floor(position) !== position
          || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}

var frontMatterDelimiter = ['~~~', '~~~'];
var fileOptions = {encoding: 'utf-8'};
var layoutsDir;

function LinkChecker(yamlDir, htmlDir, renderer) {
    this.yamlDir = yamlDir;
    this.htmlDir = htmlDir;
    this.renderer = renderer;
    this.htmlFiles = {};
    this.brokenLinks = {};
    this.renderer.on('render', function() {});
    this.originalRenderer = renderer.createRenderer;
    this.renderer.createRenderer = this.createRenderer.bind(this);
}

LinkChecker.prototype.createRenderer = function(rewriteLink) {
    var that = this;
    var markedRenderer = this.originalRenderer(rewriteLink);
    markedRenderer.link = function(href, title, text) {
        that.checkLink(href);
        return '';
    };
    return markedRenderer;
}

LinkChecker.prototype.checkLink = function(href) {
    var url = require('url').parse(href);
    if (url.host
          && url.host !== 'mygov.scot'
          && url.host !== 'www.mygov.scot') {
        return;
    }
    var path = url.path;
    if (!path.startsWith('/')) {
        return;
    }
    if (!path.endsWith('/')) {
        path += '/';
    }
    var idx = path.indexOf('#');
    if (idx > 0) {
        path = path.substring(0, idx);
    }
    if (!this.htmlFiles[path]) {
        this.brokenLink(this.item, url);
    }
}

LinkChecker.prototype.brokenLink = function(item, url) {
    var category = item.ancestors[1].title.trim();
    var pages = this.brokenLinks[category] || {};
    var links = pages[item.contentItem.title] || [];
    var formatted = require('url').format(url);
    if (links.indexOf(formatted) < 0) {
        links.push(formatted);
    }
    this.brokenLinks[category] = pages;
    pages[item.contentItem.title] = links;
}

LinkChecker.prototype.run = function(done) {
    var that = this;
    var yamlGlob = path.join(this.yamlDir, '**/*.yaml');
    glob('**/*.html', { cwd: this.htmlDir }, function (err, files) {
        if (err) {
            done(err);
            return;
        }
        files.map(function (file) {
            return '/' + file.replace(/index.html$/, '');
        }).forEach(function (file) {
            that.htmlFiles[file] = file;
        });
        glob(yamlGlob, {}, function (err, yamlFiles) {
            if (err) {
                done(err);
                return;
            }
            async.eachSeries(yamlFiles, that.processFile.bind(that), function() {
                that.report(done);
            });
        });
    });
}

LinkChecker.prototype.report = function(done) {
    var lastCategory;
    var lastPage;
    for (var categoryName in this.brokenLinks) {
        var category = this.brokenLinks[categoryName];
        var showCategory = true;
        for (var pageTitle in category) {
            var page = category[pageTitle];
            var showPage = true;
            for (var linkIdx in page) {
                var link = page[linkIdx];
                var csv = '"' + [
                    showCategory ? categoryName : '',
                    showPage ? pageTitle : '',
                    link
                ].join('","') + '"';
                console.log(csv);
                showCategory = false;
                showPage = false;
            }
        }
    }
}


LinkChecker.prototype.processFile = function(src, cb) {
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

LinkChecker.prototype.renderYamlToFile = function(data, cb) {
    var that = this;
    var data = yfm(data, frontMatterDelimiter);
    var item = data.context;
    var dst = item.url;
    item.body = data.content;
    this.item = item;
    try {
        if (shouldRender(item)) {
            this.item = item;
            var context = {
                rewriteLink: function (href) {
                    that.checkLink(href);
                }
            };
            var html = this.renderer.render(item, context);
        }
        cb();
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

module.exports = {
    LinkChecker: LinkChecker
}
