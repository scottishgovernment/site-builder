module.exports = function (mode) {
    var fs = require('fs-extra');
    var path = require('path');
    var http = require('http');

    function download(amphora, resource, callback) {
        var base =  path.join('out', 'pages', resource.metadata.namespace);
        fs.mkdirsSync(base);
        var filename = path.join(base, 
            resource.metadata.filename || resource.slug);
        http.get(resource._links.inline.href, function(response) {
            var stream = fs.createWriteStream(filename);
            response.pipe(stream);
            response.on('end', function() {
                callback();
            });
        });
    }

    return  {

        supports: function(resource) {
            return mode !== 'preview' && resource.metadata.required !== false 
                && resource.metadata.type !== 'publication-page-content' 
                && (resource._links.inline && resource.storage);
        },

        handle : function (amphora, resource, callback) {
            if (this.supports (resource)) {
                download(amphora, resource, callback);
            } else {
                callback();
            }
        }
    };
};