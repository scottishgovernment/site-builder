/**
 * Content Source - fetches published content and notifies a ContentHandler of each published item.
 **/
module.exports = function (config, contentFormatter, contentHandler) {

    var restler = require('restler');
    var async = require('async');
    var referenceDataSource = require('./referenceDataSource')(config, 'out/referenceData.json');
    var doctorFormatter = require('../render/doctor-formatter')(config, 'pages');

   var amphora = require('../render/amphora/amphora')(config);
    
    // return a url for this item (if empty then will return the url for all items)
    function url(id) {
        return config.buildapi.endpoint + 'items/' + id + '?visibility=siteBuild';
    }

    function processJson(data, callback){
        var contentItem = contentFormatter.format(JSON.parse(data));
        doctorFormatter.formatDoctorFiles(contentItem, function (err, item) {
          amphora.handleAmphoraContent(contentItem, function () {
            contentHandler.handleContentItem(contentItem, function() {
              callback(null, item);
            });
          });
        });
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
                        processJson(data, callback);
                    }
                });
    }

    // fetch all published IDs then fetch each item in turn
    function processContentItems(callback) {
        var publishedIDsURL = url('');
        restler.get(publishedIDsURL)
            .on('complete', function(data, response) {
                if (data instanceof Error || response.statusCode !== 200) {
                    callback(data);
                } else {
                    try {
                        var ids = JSON.parse(data);
                        async.each(ids, fetchItem, callback );
                    } catch (error) {
                        callback(error);
                    }
                }
            });
    }

    return {

        getContentItem : function (id, callback) {
            fetchItem(id, callback);
        },

        getContent: function (callback) {
            async.series([
                referenceDataSource.writeReferenceData,
                contentHandler.start,
                processContentItems
            ],
            function(err){
                contentHandler.end(err, callback);
            });
        }
    };
};

