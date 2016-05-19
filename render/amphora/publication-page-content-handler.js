/**
 * Amphora Publication Page Content Formatter
 * Deals with publication page html content
 **/
module.exports = function () {

    var fs = require('fs-extra');
 
    var http = require('http');

    var cheerio = require('cheerio');

    function downloadContent(base, pageContent, page, callback) {
        var body = [];
        // download html content from storage and set it to the page
        http.get(pageContent._links.inline.href, function(response) {
            response.on('data', function(chunk) {
                body.push(chunk);
            });
             response.on('end', function() {
                page.content = Buffer.concat(body).toString();
                addHeader(page);
                callback();
            });
        });
    }

    function addHeader(page) {
        var dom = cheerio.load(page.content);
        dom('h3').each(function(index, element) {
            page.header = dom(element).text();
            return;
        });
    }
    
    return {
    	handle : function (base, amphora, pageContent, callback) {
            var publication = amphora.publication;
            var page = publication.pages[pageContent.metadata.parentSlug];
            downloadContent(base, pageContent, page, callback); 
        }
    };
};

