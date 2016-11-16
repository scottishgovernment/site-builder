var sutPath = '../../out/instrument/publish/items';

describe('items', function() {

    var applicationContext = {
        context: {
            errors: []
        },
        createPrepareContext: function() {
            return {
                fetchItem: function(path, callback) {
                    callback(null, { uuid: path });
                },
                attributes: {},
                headers: {},
                applicationContext: this
            }
        },
        contentSource: {
            fetchItem: function(path, headers, visibility, callback) {
                callback(null, { uuid: path });
            },

            fetchItems: function(header, visibility, callback) {
                callback(null, ['T-2', 'T-3']);
            }
        }
    };

    var contentHandler = {
        start: function(cb) {
            cb();
        },
        end: function(err, cb) {
            cb();
        },
        handleContentItem: function(context, content, cb) {
            this.items[content.uuid] = true;
            cb(null, content);
        }
    };

    it('fetch command line items', function(done) {
        contentHandler.items = {};
        applicationContext.context.ids = ['T-1', 'T-1000'];
        // ARRANGE
        var sut = require(sutPath)(applicationContext, contentHandler);
        sut.generate(function() {
            for (var i = 0; i < applicationContext.context.ids.length; i++) {
                expect(contentHandler.items[applicationContext.context.ids[i]]).toBe(true);
            }
            done();
        });
    });

    it('fetch all', function(done) {
        contentHandler.items = {};
        applicationContext.context.ids = null;
        // ARRANGE
        var sut = require(sutPath)(applicationContext, contentHandler);
        sut.generate(function() {
            expect(contentHandler.items['T-2']).toBe(true);
            expect(contentHandler.items['T-3']).toBe(true);
            done();
        });
    });

});