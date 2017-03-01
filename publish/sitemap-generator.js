'use strict';

/**
 * Generate sitemaps from a directory of generated pages.
 */
var async = require('async');
var fs = require('fs-extra');
var path = require('path');
var glob = require('glob');

var fileOptions = {encoding: 'utf-8'};

function getCategoryForItem(item) {
    var category = 'root';
    if (item.ancestors.length > 1 ) {
        var ancestorUrl = item.ancestors[1].url;
        category = ancestorUrl.replace(/\//g, '');
    }
    return category;
}

function getEntryForItem(baseurl, item) {
    var lastmod = item.contentItem.dateModified
        ? item.contentItem.dateModified : item.contentItem.dateCreated;
    return {
        loc: baseurl + item.url,
        lastmod: lastmod
    };
}

function recordEntryByCategory(pagesByCategory, category, entry) {
    if (!pagesByCategory[category]) {
        pagesByCategory[category] = [];
    }
    pagesByCategory[category].push(entry);
}

function sitemapFilenameForCategory(category) {
    return ['sitemap', category, 'xml'].join('.');
}

function writeSitemapIndex(baseurl, targetdir, categories, callback) {
    var content = '';
    content += '<?xml version="1.0" encoding="UTF-8"?>\n';
    content += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    categories.forEach(function (category) {
        var url = baseurl + '/' + sitemapFilenameForCategory(category.category);
        var line = '<sitemap><loc>' +  url + '</loc></sitemap>\n';
        content += line;
    });
    content += '</sitemapindex>\n';
    fs.writeFile(targetdir + '/sitemap.xml', content, callback);
}

function categoriesArray(pagesByCategory) {
    var categories = [];

    // turn the object into an array
    for (var category in pagesByCategory) {
        if (pagesByCategory.hasOwnProperty(category)) {
            categories.push({
                category: category,
                pages : pagesByCategory[category]
            });
        }
    }
    return categories;
}

function writeSitemapForCategory(targetdir, category, callback) {
    var content = '';
    content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    category.pages.forEach(function (page) {
        content += '<url>\n';
        content += '<loc>' + page.loc + '</loc>\n';
        content += '<lastmod>' + page.lastmod + '</lastmod>\n';
        content += '</url>\n';
    });
    content += '</urlset>';

    var filename = sitemapFilenameForCategory(category.category);
    fs.writeFile(targetdir + '/' +  filename, content, callback);
}

function writeSitemapForCategories(targetdir, categories, callback) {
    async.each(categories,
        function (category, categoryCallback) {
            writeSitemapForCategory(targetdir, category, categoryCallback);
        }, callback);
}

module.exports = function (tempdir, baseurl, callback) {

    var srcdir = path.join(tempdir, 'pages');
    var targetdir = path.join(tempdir, 'sitemap');

    // ensure that the target directory exists
    fs.mkdirsSync(targetdir);
    fs.emptyDirSync(targetdir);

    // use blog to get all of the json files
    var globSpec = path.join(srcdir, '**/*.json');
    glob(globSpec, {}, function (err, files) {
        var pagesByCategory = {};

        async.each(files,
            // for each file record an entry
            function (file, fileCallback) {
                fs.readFile(file, fileOptions, function (readerr, data) {

                    if (readerr) {
                        fileCallback(readerr);
                        return;
                    }

                    var item = JSON.parse(data);
                    var category = getCategoryForItem(item);
                    var entry = getEntryForItem(baseurl, item);
                    recordEntryByCategory(pagesByCategory, category, entry);
                    fileCallback();
                });
            },

            // we have all of the entries, now write the sitemaps
            function (err) {

                if (err) {
                    callback(err);
                    return;
                }
                var categories = categoriesArray(pagesByCategory);

                // create sitemap.xml linking to each category
                async.series([
                        function (cb) {
                            writeSitemapIndex(baseurl, targetdir, categories, cb);
                        },

                        function (cb) {
                            writeSitemapForCategories(targetdir, categories, cb);
                        }
                    ],
                    callback
                );
            }
        );
    });
};
