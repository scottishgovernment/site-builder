
module.exports = function () {
 
    var http = require('http');

    var cheerio = require('cheerio');

    function downloadContent(pageContent, page, callback) {
        var body = [];
        // download html content from storage and set it to the page
        http.get(pageContent._links.inline.href, function(response) {
            response.on('data', function(chunk) {
                body.push(chunk);
            });
             response.on('end', function() {
                page.content = Buffer.concat(body).toString();
                addTitle(page);
                callback();
            });
        });
    }

    function addTitle(page) {
        var title = cheerio.load(page.content).('h3').next();
        if (title) {
            page.title = title.trim();
        }
    }
    
    return {

        supports: function (resource) {
            return resource.metadata.required !== false 
                && resource.metadata.type === 'publication-page-content';
        },

    	handle : function (amphora, resource, callback) {
            if (this.supports(resource)) {
                var publication = amphora.publication;
                var page = publication.pages[resource.metadata.parentSlug];
                downloadContent(resource, page, callback);
            } else {
                callback();
            }
        }
    };
};

