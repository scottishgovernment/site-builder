// ContentHandler that passes content to the search service for indexing
//
// The ContentSource will call the method of this object as it fetched the content.
module.exports = function (searchURL) {

    var restler = require('restler');

    return {

        // called when the content source is starting
        start : function(callback) {
            // clear the index
            restler.del(searchURL);
            setTimeout(
                function() {
                    // restler does not handle 204 header hence timeout
                    callback();
                },
                3000);
        },

        // called for each content item provided by the content source
        handleContentItem : function(item, callback) {
            // index the item using the search service

            // we only want to index the content item (not andcestors etc.)
            // but we need the url to be included
            var contentItem = item.contentItem;
            contentItem.url = item.url;
            contentItem._embedded.format.name = contentItem._embedded.format.name.toLowerCase();

            // Hack for topics ...
            contentItem.topicNames = [];
            contentItem._embedded.topics.forEach(function (t) {
                contentItem.topicNames.push(t.name);
            });

            restler.putJson(searchURL, contentItem)
                .on('complete', function() {
                     //Should log the failure to index
                     callback();
                });
        },

        // called when the content source will provide no more items
        end : function(err, callback) {
            callback(err);
        }
    };
};

