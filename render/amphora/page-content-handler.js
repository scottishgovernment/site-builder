module.exports = function () {

    var http = require('http');
    var cheerio = require('cheerio');

    function getParentSlug(resource) {
        var paths = resource.path.split('/');
        return paths[paths.length - 3];
    }

    function updatePage(amphora, resource) {
        var page = amphora.publication.pages[getParentSlug(resource)];
        page.content = new Buffer(resource.storageContent, 'base64').toString('utf8');
        var title = cheerio.load(page.content)('h3').first();
        if (title) {
            page.title = title.text().trim();
        }
    }

    return {

        supports: function (resource) {
            return resource.metadata.required !== false
                && resource.metadata.type === 'publication-page-content';
        },

        handle : function (amphora, resource, callback) {
            if (this.supports(resource)) {
                updatePage(amphora, resource);
            } 
            callback();
        }
    };
};
