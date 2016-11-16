var sutPath = '../../../out/instrument/publishing/format/prepare-item';

describe('prepare-item', function() {

    var context = {
        attributes: {
        },
        app: {
            amphora: {
                documents: function(context, content, cb) {
                    cb();
                }
            }
        }
    };

    var content = {
        uuid: 'uuid',
        contentItem: {
            _embedded: {
                format: {
                    name: 'SITE_BUILDER_TEST',
                    _embedded: {
                        category: { id: 'standard' }
                    }
                }
            }
        }
    };

    var site = {
        getFormat: function() {
            return {
                layout: function() {
                    return 'site-builder-test.hbs';
                },

                prepareForRender: function(context, content, callback) {
                    callback(null, content);
                }
            }
        }
    };

    it('prepares content item', function(done) {
        var sut = require(sutPath)(site);
        sut(context, content, function() {
            expect(content.layout).toEqual('site-builder-test.hbs');
            done();
        });
    });

});