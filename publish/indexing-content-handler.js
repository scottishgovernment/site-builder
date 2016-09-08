// ContentHandler that passes content to the search service for indexing
//
// The ContentSource will call the method of this object as it fetched the content.
module.exports = function (searchURL) {

    var restler = require('restler');
    var count = 0;

    return {

        // called when the content source is starting
        start : function(callback) {
          count = 0;

          // notify search that we are about to begin a site search
          restler
            .postJson(searchURL + 'siteIndexBegin', {})
            .on('complete', function(err) {
              callback();
            });
        },

        // called for each content item provided by the content source
        handleContentItem : function(item, callback) {

            if (item.contentItem._embedded.format._embedded.siteSearchable !== true) {
                callback();
                return;
            }
            count++;

            // index the item using the search service
            // we only want to index the content item (not andcestors etc.)
            // but we need the url to be included
            var contentItem = item.contentItem;
            contentItem.url = item.url;
            contentItem._embedded.format.name = contentItem._embedded.format.name.toLowerCase();

            // Hack for topics ...
            contentItem.topicNames = [];
            if ( contentItem._embedded.topics ) {
                contentItem._embedded.topics.forEach(function (t) {
                    contentItem.topicNames.push(t.name);
                });
            }
            contentItem.filterDate = item.filterDate;
            contentItem.label = item.label;

            restler.putJson(searchURL, contentItem)
                .on('complete', function(err) {
                     //Should log the failure to index
                     callback();
                });
        },

        // called when the content source will provide no more items
        end : function(err, callback) {

            console.log('Indexed ' + count + ' items');

            // tell the search service that the indexing is finished.
            restler
              .postJson(searchURL + 'siteIndexEnd', {})
              .on('complete', callback);
        }
    };
};
