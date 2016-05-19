/**
 * Amphora Source - amphora items.
 * eozcan
 **/
module.exports = function (config, target) {

    var fs = require('fs-extra');
    var restler = require('restler');
    var path = require('path');
    var async = require('async');
    var formatter = require('./formatter')();

    var handlers = {
    	objects : {
    	    'default' : require('./default-handler')(),
    	    'publication' : require('./publication-handler')(),
            'publication-page' : require('./publication-page-handler')(),
            'publication-page-content' : require('./publication-page-content-handler')()
        },
        select : function(resourcetype) {
        	var handler = this.objects[resourcetype];
        	if (!handler) {
        		handler = this.objects['default'];
        	}
        	return handler;
        }
    };

     // fetch the resource from amphora with this location
    function fetchResource(amphora, location, callback) {
        var location = config.amphora.endpoint + location;
        restler.get(location).on("complete", function(data, response) {
            if (data instanceof Error || response.statusCode !== 200) {
                callback(data);
            } else {
                if (data.metadata.required !== false) {
                    var base =  path.join(target, data.metadata.namespace);
                    fs.mkdirsSync(base);
                    handleResource(amphora, data, base, callback);
                } else {
                    callback();
                }
            }
        });
    }

    // handle each resource and the children recursively
    // generage local copy of amphora resources by fetching the binaries
    // handle thumbnails if necessary
    function handleResource(amphora, resource, base, callback) {
        handlers.select(resource.metadata.type).handle(base, amphora, resource, function() {
            async.each(resource.resources, function(child, sub) {
                fetchResource(amphora, child.path, sub);
            }, callback);    
        });
    }

    return {
    	handleAmphoraContent : function (item, callback) {
    		if (item.contentItem._embedded.format['name'] === 'APS_PUBLICATION') {
                // create new amphora
                var amphora = {};
                fetchResource(amphora, item.url, function () {
                    item.amphora = amphora;
                    formatter.cleanup(target, item, function() {
                        callback();
                    });
                });
    		} else {
                callback();
            }
        }
    };
};
