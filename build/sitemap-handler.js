// ContentHandler that writes sitemap xml files to the web doc root
//
// The ContentSource will call the method of this object as it fetched the content.
module.exports = function(root) {

    var fs = require('fs-extra');
    var df = require('dateformat');
    var del = require('del');
    var yaml = require('js-yaml');

    var sitemaps = {};

    var config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));

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

    var appendToSitemap = function(item) {
        var url = item.url;
        var lastModified = df(Date.parse(item.contentItem.dateModified), 'yyyy-mm-dd');
        fs.appendFileSync(root + getFilename(item), '<url><loc>https://www.mygov.scot'+addSlash(url)+'</loc><lastmod>'+lastModified+'</lastmod></url>\n');

    };

    var prepareFile = function(item) {
        var filename = getFilename(item);
        if (!sitemaps[filename]) {
            fs.appendFileSync(root + filename, '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');
            sitemaps[filename] = true;
        }
    };

    var closeFiles = function() {
        var rootSitemap = root + '/sitemap.xml';
        fs.appendFileSync(rootSitemap, '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' );
        for (var sitemap in sitemaps) {
            if (sitemaps.hasOwnProperty(sitemap)) {
                fs.appendFileSync(root + sitemap, '</urlset>\n' );
                fs.appendFileSync(rootSitemap, '<sitemap><loc>https://www.mygov.scot'+addSlash(sitemap)+'</loc></sitemap>\n');
            }
        }
        fs.appendFileSync(rootSitemap, '</sitemapindex>\n' );
    };

    var isIncluded = function(item) {
        if ( config.sitemaps.exclude_formats.indexOf(item.contentItem._embedded.format.name) > -1
          || config.sitemaps.exclude_slugs.indexOf(item.contentItem.slug) > -1 ){
            return false;
        } else {
            return true;
        }
    };

    return {

        // called when the content source is starting
        start: function(callback) {
            fs.mkdirsSync(root);
            del(root + "/sitemap.*");
            callback();
        },

        // called for each content item provided by the content source
        handleContentItem: function(item, callback) {
            if (isIncluded(item)) {
                prepareFile(item);
                appendToSitemap(item);
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