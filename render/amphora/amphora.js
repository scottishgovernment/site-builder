/**
 * Amphora Source - amphora items.
 * eozcan
 **/
module.exports = function (config, mode) {

    var restler = require('restler');
    var async = require('async');
    var formatter = require('./publication-formatter')();

    var ph = require('./publication-handler')(mode);
    var rh = require('./resource-handler')(mode);
    var pch = require('./page-content-handler')(mode);
    var dh = require('./download-handler')(mode);

     // fetch the resource from amphora with this location
    function fetchResource(amphora, location, callback) {
        var location = config.amphora.endpoint + location;
        restler.get(location).on("complete", function(resource, response) {
            if (resource instanceof Error || response.statusCode !== 200) {
                callback(resource);
            } else {
                handleResource (amphora, resource, callback);
            }
        });
    }

    function handleResource(amphora, resource, callback) {
        async.series([
            function (cb) {
               ph.handle(amphora, resource, cb);
            },
            function (cb) {
               rh.handle(amphora, resource, cb);
            },
            function (cb) {
               dh.handle(amphora, resource, cb);
            },
            function (cb) {
               pch.handle(amphora, resource, cb);
            }
        ],
        function (err, results) {
           async.each(resource.resources, function(child, sub) {
                fetchResource(amphora, child.path, sub);
            }, callback); 
        });
    }

    return {
    	handleAmphoraContent : function (item, callback, currentPage) {
            if (item.contentItem._embedded.format['name'] !== 'APS_PUBLICATION') {
                callback(null, item);
            } else {
                var amphora = {};
                fetchResource(amphora, item.url, function(err) {
                    if (err) {
                        console.log(err);
                        callback(err);
                    } else {
                        item.amphora = amphora;
                        formatter.cleanup(item, mode, callback, currentPage);
                    }
                });
            }
        }
    };
};
