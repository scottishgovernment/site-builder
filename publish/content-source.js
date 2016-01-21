/**
 * Content Source - fetches published content and notifies a ContentHandler of each published item.
 **/
module.exports = function (config, contentFormatter, contentHandler) {

    var restler = require('restler');
    var async = require('async');
    var fs = require('fs');
    var referenceDataSource = require('./referenceDataSource')(config, 'out/referenceData.json');

    // return a url for this item (if empty then will return the url for all items)
    function url(id) {
        return config.buildapi.endpoint + 'items/' + id + '?visibility=siteBuild';
    }

    function processJson(data, callback){
       try {
            var contentItem = contentFormatter.format(JSON.parse(data));
            contentHandler.handleContentItem(contentItem,
                                            function() {
                                                callback(null, contentItem);
                                            });
        } catch (error) {
           callback(error);
        }
    }

    // fetch the item with this id
    function fetchItem(id, callback) {
        var itemUrl = url(id);
        var now = new Date();
        restler
            .get(itemUrl)
                .on("complete", function(data, response) {
                  console.log(new Date() - now);
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
        console.log('processContentItems ', publishedIDsURL);
        restler.get(publishedIDsURL)
            .on('complete', function(data, response) {
                if (data instanceof Error || response.statusCode !== 200) {
                    callback(data);
                } else {
                    try {
                        var ids = JSON.parse(data);
                        async.eachLimit(ids, 1000, fetchItem, callback );
                    } catch (error) {
                        callback(error);
                    }
                }
            });
    }

    function processStaticFile(filename, callback) {
        var json = "resources/doctor/"+filename+"/index.json";
        console.log("processing doctor file "+json);
        fs.readFile( json, 'utf8',
                    function(err, data) {
                                if (err){
                                    console.log(err);
                                    callback(err);
                                } else
                                {
                                    processJson(data, callback);
                                }//
                            });

    }

    function processStaticFiles(callback) {
        console.log("Starting to doctor files....");
        if ( fs.existsSync('resources/doctor/')){
            fs.readdir('resources/doctor/', function(err, files){
                async.each(files,  processStaticFile,
                                function(err) {
                                    callback(err);
                                });
            });
        } else {
            callback();
        }
    }

    return {

        getContentItem : function (id, callback) {
            fetchItem(id, callback);
        },

        getContent: function (callback) {
            async.series([
                referenceDataSource.writeReferenceData,
                contentHandler.start,
                processContentItems,
                processStaticFiles
            ],
            function(err){
                contentHandler.end(err, callback);
            });
        }
    };
};
