'use strict';

var async = require('async');
var path = require('path');


var assemble = function(context, content, document, cb) {
    var resourcePath = '/docs/' + document.externalDocumentId;
    context.app.amphora.resource(context, resourcePath, function(err, amphoraResource) {
        if (err) {
            err.id = content.uuid;
            // legacy application ignores amphora failures
            cb(null, content);
            return;
        }
        // override namespace with content's namespace
        amphoraResource.metadata.namespace = content.url;
        // manually set type for legacy doctor documents so that a handler can be triggered
        amphoraResource.metadata.type = 'doctor';
        // format content
        document.amphora = amphoraResource;
        document.amphora.filename = path.join(content.url, path.basename(amphoraResource.metadata.filename));
        if (document.uuid === content.documents[0].uuid) {
            content.amphora = document.amphora;
        }
        // hand over to amphora
        context.app.amphora.handle(context, content, amphoraResource, cb);
    });
};

var documents = function(context, content, topCallback) {
    content.documents = content.contentItem._embedded.documents;
    if (!content.documents || content.documents.length === 0) {
        topCallback(null, content);
    } else {
        async.each(content.documents, function(document, callback) {
                assemble(context, content, document, callback);
            },
            function(err, data) {
               // console.log('[amphora] assembled legacy (doctor) content for:' + content.url);
                topCallback(err, content);
            }
        );
    }
};

module.exports = documents;
