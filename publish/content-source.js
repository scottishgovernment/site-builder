/**
 * Content Source - fetches published content and notifies a ContentHandler of each published item.
 **/
module.exports = function (config, contentFormatter, contentHandler) {

    var restler = require('restler');
    var async = require('async');

    // return a url for this item (if empty then will return the url for all items)
    function url(id) {
        return config.buildapi.endpoint + 'items/' + id + '?visibility=siteBuild';
    }

    // fetch the item with this id
    function fetchItem(id, callback) {
        var itemUrl = url(id);
        restler
            .get(itemUrl)
                .on("complete", function(data, response) {
                    if (data instanceof Error || response.statusCode !== 200) {
                        callback(data);
                    } else {
                        try {
                            var contentItem = contentFormatter.format(JSON.parse(data));
                            contentHandler.handleContentItem(contentItem,
                                function () {
                                    callback(null, contentItem);
                                });
                        } catch (error) {
                            callback(error);
                        }
                    }
                });
    }

    // fetch all published IDs then fetch each item in turn
    function fetchIDs(callback) {
        var publishedIDsURL = url('');
        restler.get(publishedIDsURL)
            .on('complete', function(data, response) {
                if (data instanceof Error || response.statusCode !== 200) {
                    contentHandler.end(data, callback);
                } else {
                    try {
                        var ids = JSON.parse(data);

                        async.each(ids, fetchItem,
                            function(err) {
                                contentHandler.end(err, callback);
                            });
                    } catch (error) {
                        contentHandler.end(error, callback);
                    }
                }
            });
    }

    return {

        getContentItem : function (id, callback) {
            fetchItem(id, callback);
        },

        getContent: function (callback) {
             // tell the content Handler we are starting so that it can perform
            contentHandler.start(
                function () {
                    // start by fetching the published IDs
                    fetchIDs(callback);
                });
        }
    };
};
