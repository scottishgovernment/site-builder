/**
 * Amphora Default Handler
 * This object is responsible for creating a local (RAW) copy of 
 * a amphora  resource and all of its children
 **/
module.exports = function () {
  var fs = require('fs-extra');
  var path = require('path');
    var http = require('http');

    function createSource(resource) {
        // copy required fields from amphora resource
        var source = resource.metadata || {};
        source.path = resource.path;
        source.index = resource.ordinal;
        source.details = resource.storage.metadata;
        source.url = resource.metadata.namespace 
              + (resource.metadata.filename || slug);
        return source;
    }

    function download(base, amphora, resource, callback) {
        var filename = path.join(base, resource.metadata.filename || resource.slug);
        http.get(resource._links.inline.href, function(response) {
            var stream = fs.createWriteStream(filename);
            response.pipe(stream);
            response.on('end', function() {
                callback();
            });
        });
    }

    return  {

      handle : function (base, amphora, resource, callback) {
             if (resource._links.inline && resource.storage) {
                var pub = amphora.publication;
                // use parentslug to group resources
                var prop = resource.metadata.parentSlug;
                pub[prop] = pub[prop] || [];
                pub[prop].push(createSource(resource));
                // sort by actual index of the resource, 
                // this can be zero if it is not set during amphora upload
                pub[prop].sort(function (a, b) {
                    return a.index - b.index;
                });
                download(base, amphora, resource, callback);
            } else {
                callback(); 
            }
        }

    };
};