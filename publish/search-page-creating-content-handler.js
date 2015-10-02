// ContentHandler that creates the yaml required by the search results page.  This would probably be
// better handled by making the search results page a content managed content item.
//
// The ContentSource will call the method of this object as it fetched the content.


module.exports = function (rootDir) {

    var fs = require('fs-extra');
    var yaml = require('js-yaml');

    var siteItems;

    return {

        // called when the content source is starting
        start : function(callback) {
            callback();
        },

        // called for each content item provided by the content source
        handleContentItem : function(item, callback) {
            // remember the siteItems so that we can add it to the search yaml
            siteItems = item.siteItems;
            callback();
        },

        // called when the content source will provide no more items
        end : function(err, callback) {
            var search = {
                "name": "search",
                "contentItem": {
                    "title": "Search Results",
                    "summary": "Search results page"
                },
                "layout": "search.hbs",
                "siteItems": siteItems
            };
            var yamlData = '---\n' + yaml.dump(search) + '---\n';
            var filename = rootDir + '/' + 'search.yaml';
            fs.writeFileSync(filename, yamlData);
            callback(err);
        }
    };
};