module.exports = function() {

    var fs = require('fs-extra');
    var path = require('path');
    var request = require('request');

    function download(amphora, resource, callback) {
        var base = path.join('out', 'pages', resource.metadata.namespace);
        fs.mkdirsSync(base);
        var filename = path.join(base,
            resource.metadata.filename || resource.slug);
        var stream = fs.createWriteStream(filename);
        var downloadUrl = resource._links.attachment.href;
        request.get(downloadUrl)
            .on('end', callback)
            .pipe(stream);
    }

    return {

        supports: function(resource) {
            // do not download resources on preview
            if (process.mode === 'preview') {
                return false;
            }

            var downloadable = resource._links.inline && resource.storage;
            var required = resource.metadata.required !== false;
            // page contents are already downloaded by page-content-handler
            var pageContent = resource.metadata.type === 'publication-page-content';

            return !pageContent && required && downloadable;
        },

        handle: function(amphora, resource, callback) {
            if (this.supports(resource)) {
                download(amphora, resource, callback);
            } else {
                callback();
            }
        }
    };
};