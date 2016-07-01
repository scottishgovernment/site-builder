// ContentHandler that writes sitemap xml files to the web doc root
//
// The ContentSource will call the method of this object as it fetched the content.
module.exports = function(root, baseUrl) {

    var fs = require('fs-extra');
    var marked = require('marked');

    var sitemaps = {};

    var addSlash = function(uri) {
        if ( uri.indexOf('/') === 0 ) {
            return uri;
        } else {
            return '/' + uri;
        }
    };

    var getFilename = function(item) {
       if ( item.ancestors.length > 1 ) {
           var ancestorUrl = item.ancestors[1].url;
           var category = ancestorUrl.replace(/\//g, '.');
           var filename = '/sitemap'+category+'xml';
           return filename;
       } else {
           return '/sitemap.root.xml';
       }
    };

    var appendToSitemap = function(filename, lastModified, url) {
        fs.appendFileSync(root + filename, '<url><loc>'+
          baseUrl + addSlash(url) +
          '</loc><lastmod>'+lastModified+'</lastmod></url>\n');
    };

    var prepareFile = function(item) {
        var filename = getFilename(item);
        var header =
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        if (!sitemaps[filename]) {
            fs.appendFileSync(root + filename, header);
            sitemaps[filename] = true;
        }
    };

    var closeFiles = function() {
        var rootSitemap = root + '/sitemap.xml';
        var header =
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        fs.appendFileSync(rootSitemap, header);
        for (var sitemap in sitemaps) {
            if (sitemaps.hasOwnProperty(sitemap)) {
                fs.appendFileSync(root + sitemap, '</urlset>\n' );
                var line =
                    '<sitemap><loc>' +
                    baseUrl + addSlash(sitemap) +
                    '</loc></sitemap>\n'
                fs.appendFileSync(rootSitemap, line);
            }
        }
        fs.appendFileSync(rootSitemap, '</sitemapindex>\n' );
    };

    var isIncluded = function(item) {
        return item.contentItem._embedded.format._embedded.internetSearchable;
    };

    return {

        // called when the content source is starting
        start: function (callback) {
            fs.mkdirsSync(root);
            fs.emptyDir(root, callback);
        },

        // called for each content item provided by the content source
        handleContentItem: function(item, callback) {
            if (isIncluded(item)) {
                prepareFile(item);

                var filename = getFilename(item);
                var lastModified = item.contentItem.dateModified;
                appendToSitemap(filename, lastModified, item.url);

                // if it is a guide then also add its sub-pages
                if (item.contentItem._embedded.format.name === 'GUIDE') {
                    var html = marked(item.contentItem.content);
                    var $ = require('cheerio').load(html);
                    $('h1').each(function(index, element) {
                        var slug = $(element).text().toLowerCase().replace(/[^\w]+/g, '-');
                        var url = item.url + slug + '/';
                        appendToSitemap(filename, lastModified, url);
                    });
                }

                if (item.contentItem._embedded.format.name === 'APS_PUBLICATION') {
                  var pages = item.amphora.publication.pages;
                  pages.forEach(function (page){
                    appendToSitemap(filename, lastModified, page.url);
                  });
                }
            }
            callback();
        },

        // called when the content source will provide no more items
        end: function(err, callback) {
            closeFiles();
            callback(err);
        }
    };
};
