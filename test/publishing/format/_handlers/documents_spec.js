var sutPath = '../../../../out/instrument/publishing/format/_handlers/amphora/documents';

describe('documents', function() {


    // this resource does not have link: inline, can  be stored (downloaded)
    var amphoraDocResource = {
        resources: [],
        storage: {
            id: 'storage-id'
        },
        path: '/docs/21JASDFOIU24/',
        metadata: {
            filename: 'logo.png',
            namespace: '/docs/',
        },
        _links: {
            inline: 'download-me'
        }
    };


    var stream = {};

    var context = {
        attributes: {

        },
        app: {
            context: {
                errors: []
            },
            config: {
                amphora: {
                    endpoint: '/amphora/'
                }
            },
            amphora: {
                resource: function(context, namespace, cb) {
                    cb(null, amphoraDocResource);
                },
                handle: function(context, content, resource, callback) {
                    callback(null, content);
                }
            }
        }
    };

    var content = {
        uuid: 'uuid',
        url: '/parent/',
        contentItem: {
            _embedded: {
                documents: [{ extranalDocumentId: 'D-1' }]
            }
        }
    };

    var contentWithNoDocuments = {
        uuid: 'uuid',
        url: '/parent/',
        contentItem: {
            _embedded: {}
        }
    };

    it('can ignore content item without documents', function(done) {
        var sut = require(sutPath);
        expect(amphoraDocResource.metadata.type).toBe(undefined);
        sut(context, contentWithNoDocuments, function() {
            expect(contentWithNoDocuments.amphora).toBe(undefined);
            done();
        });
    });

    it('can fetch documents', function(done) {
        var sut = require(sutPath);
        expect(amphoraDocResource.metadata.type).toBe(undefined);
        sut(context, content, function() {
            expect(amphoraDocResource.metadata.type).toEqual('doctor');
            done();
        });
    });
});