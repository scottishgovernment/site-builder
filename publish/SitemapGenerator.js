'use strict';

const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const csv = require('fast-csv');
const es = require('elasticsearch');

/**
 * Express app that defines endpoints for the CPI data service.
 */
class SitemapGenerator {

    generateSitemap(targetdir, homepage, callback) {
        var sitemapDataPath = path.join(targetdir, 'sitemapData.json');
        var sitemapDir = path.join(targetdir, 'sitemap');

        // ensure that an empty sitemap directory is present
        fs.mkdirsSync(sitemapDir);
        fs.emptyDirSync(sitemapDir);

        fs.readFile(sitemapDataPath,
            (sitemapErr, data) => {
                if (sitemapErr) {
                    console.log('Failed to load index file ');
                    callback(sitemapErr);
                }

                const parsedData = JSON.parse(data);

                // group the data by category
                const pagesByCategory = {};
                Object.keys(parsedData)
                    .map(key => parsedData[key])
                    .forEach(datum => {
                        if (!pagesByCategory[datum.category]) {
                            pagesByCategory[datum.category] = [];
                        }
                        pagesByCategory[datum.category].push(datum);
                    });

                // write out the sitemap index file
                const sortedCategories = Object.keys(pagesByCategory).sort();

                // write each of the category sitemaps
                async.each(sortedCategories,
                    (category, cb) => writeSitemapForCategory(
                        sitemapDir, homepage, category, pagesByCategory[category], cb),
                    () => writeSitemapIndex(
                        homepage, sitemapDir, sortedCategories, pagesByCategory, callback)
                );
            });
    }
}

function writeSitemapIndex(baseurl, targetdir, categoryNames, pagesByCategory, callback) {
    var content = '';
    content += '<?xml version="1.0" encoding="UTF-8"?>\n';
    content += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    categoryNames.forEach(categoryName => {
        var url = baseurl + '/' + sitemapFilenameForCategory(categoryName);
        var line = '<sitemap><loc>' +  url + '</loc></sitemap>\n';
        content += line;
    });
    content += '</sitemapindex>\n';
    fs.writeFile(targetdir + '/sitemap.xml', content, callback);
}

function writeSitemapForCategory(targetdir, baseurl, categoryName, pages, callback) {
    var content = '';
    content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    pages.forEach(function (page) {
        content += '<url>\n';
        content += '<loc>' + baseurl + page.url + '</loc>\n';
        content += '<lastmod>' + page.lastmod + '</lastmod>\n';
        content += '</url>\n';
    });
    content += '</urlset>';

    const filename = sitemapFilenameForCategory(categoryName);
    const targetFile = path.join(targetdir, filename);
    fs.writeFile(targetFile, content, callback);
}

function sitemapFilenameForCategory(category) {
    return ['sitemap', category, 'xml'].join('.');
}

module.exports = SitemapGenerator;
