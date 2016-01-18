//var sutPath = '../../out/instrument/preview/content-source';
var sutPath = '../../preview/content-source';
describe('Content source, preview', function() {

    var guideItem = {
        contentItem: {
          _embedded : {
              format: {
                name: 'GUIDE',
                _embedded : {
                  format: {
                    structural: false
                  }
                }
              }
            },

            content: '<h1>slug1</h1><h1>slug2</h1>'
        }
    };

    var anyItem = {
        contentItem: {
            _embedded : {
              format: {
                name: 'ANY',
                _embedded : {
                    format: {
                      structural: false
                    }
                }
              }
            },
            content: 'content'
        }
    };

    it('Fetch guide', function(done) {
        var restler = {
            get: function(url, cred) {
                return {
                    on: function(event, callback) {
                        if (url.indexOf('/guide/slug2/') !== -1){
                            var err = new Error({status: 404});
                            callback(err);
                        } else {
                            callback(JSON.stringify(guideItem));
                        }
                    }
                }
            }
        };

        var sut = require(sutPath)(restler);
        sut.fetch({path: '/guide/slug2/'}, {}, 'siteBuild', function(error, item) {
            expect('guide.hbs').toEqual(item.layout);
            expect(guideItem.contentItem.content).toEqual(item.body);
            expect('slug2').toEqual(item.contentItem.guidepageslug);
            done();
        });
    });

    it('Fetch any', function(done) {
        var sut = require(sutPath)();
        var restler = {
            get: function(url, cred) {
                return {
                    on: function(event, callback) {
                        callback(JSON.stringify(anyItem));
                    }
                }
            }
        };

        var sut = require(sutPath)(restler);
        sut.fetch({ path: '/any/'}, {}, 'siteBuild', function(error, item) {
            expect('any.hbs').toEqual(item.layout);
            expect(anyItem.contentItem.content).toEqual(item.body);
            expect(item.contentItem.guidepageslug).toBeUndefined();
            done();
        });

    });

    it('Fetch any with parent, but not guide', function(done) {
        var sut = require(sutPath)();
        var restler = {
            get: function(url, cred) {
                return {
                    on: function(event, callback) {
                        callback(JSON.stringify(anyItem));
                    }
                }
            }
        };

        var sut = require(sutPath)(restler);
        sut.fetch({ path: '/parent/any/' }, {}, 'siteBuild', function(error, item) {
            expect('any.hbs').toEqual(item.layout);
            expect(anyItem.contentItem.content).toEqual(item.body);
            expect(item.contentItem.guidepageslug).toBeUndefined();
            done();
        });

    });

    it('Fetch not found', function(done) {
        var sut = require(sutPath)();
        var restler = {
            get: function(url, cred) {
                return {
                    on: function(event, callback) {
                        callback(null, {
                            statusCode: 404
                        });
                    }
                }
            }
        };

        var sut = require(sutPath)(restler);
        sut.fetch({ path: '/any/' }, {}, 'siteBuild', function(error, item) {
            expect(item).toBeUndefined();
            expect(error.message.indexOf('Failed') > -1).toBe(true);
            done();
            done();
        });

    });

    it('Fetch with error', function(done) {
        var sut = require(sutPath)();
        var sut = require(sutPath)();
        var restler = {
            get: function(url, cred) {
                return {
                    on: function(event, callback) {
                        callback(new Error('_connection_refused'));
                    }
                }
            }
        };

        var sut = require(sutPath)(restler);
        sut.fetch({ path: '/any/' }, {}, 'siteBuild', function(error, item) {
            expect(item).toBeUndefined();
            expect(error.message.indexOf('_connection_refused') > -1).toBe(true);
            done();
        });
        sut.fetch({ path: '/parent/any/'}, {}, 'siteBuild', function(error, item) {
            expect(item).toBeUndefined();
            expect(error.message.indexOf('_connection_refused') > -1).toBe(true);
            done();
        });
    });
});
