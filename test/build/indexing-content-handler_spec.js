var sutPath = '../../out/instrument/build/indexing-content-handler';

describe('indexing-content-handler', function() {

    function item(url, format) {
        return {
            url : url, 
            contentItem : {
                _embedded: {
                    format: {
                        name:format
                    }
                }
            }
        }
    }

    var testPort = 9999;
    var testUrl = 'http://localhost:'+testPort+'/';
    var async = require('async');

    it('green path', function(done) {

        // ARRANGE
        var items = [
            item('/multi/segement/url', 'CATEGORY_LIST'),
            item('/single-segment-url', 'ARTICLE'),
            item('/organisations', 'ORG_LIST')
        ];
        var testSearchServer = require('./test-search-server')();   
        var testApp = testSearchServer.startServer(testPort);     
        var sut = require(sutPath)(testUrl);

        //ACT
        async.series([
                function (callback) { 
                    sut.start(callback)
                },
                function (callback) { 
                    sut.handleContentItem(items[0], callback);
                }, 
                function (callback) { 
                    sut.handleContentItem(items[1], callback);
                }, 
                function (callback) { 
                    sut.handleContentItem(items[2], callback);
                }, 
                function (callback) { 
                    sut.end(null, function() { callback(); });
                }
            ], 
            function (err, results) {
                testApp.close();
                // ASSERT 
                // clear index was called
                expect(testSearchServer.wasIndexCleared()).toBe(true);

                // each of the items were indexed
                expect(testSearchServer.wasIndexed(items[0])).toBe(true);
                expect(testSearchServer.wasIndexed(items[1])).toBe(true);
                expect(testSearchServer.wasIndexed(items[2])).toBe(true);
                done();
            }
        );        
    });

    it('search server not running', function(done) {

        // ARRANGE
        var items = [
            item('/multi/segement/url', 'CATEGORY_LIST')
        ];
        var sut = require(sutPath)(testUrl);

        //ACT
        async.series([
                function (callback) { 
                    sut.start(callback)
                },
                function (callback) { 
                    sut.handleContentItem(items[0], callback);
                }, 
                function (callback) { 
                    sut.end(null, function () { callback(); });
                }
            ], 
            function (err, results) {
                // ASSERT - todo once error handleing has been defined assrt it here
          
                done();
            }
        );        
    });

    it('search server returns error', function(done) {
 
        // ARRANGE
        var items = [
            item('/multi/segement/url', 'CATEGORY_LIST'),
            item('/single-segment-url', 'ARTICLE'),
            item('/organisations', 'ORG_LIST')
        ];
        var testSearchServer = require('./test-search-server')();   
        var testApp = testSearchServer.startFaultyServer(testPort);     
        var sut = require(sutPath)(testUrl);

        //ACT
        async.series([
                function (callback) { 
                    sut.start(callback)
                },
                function (callback) { 
                    sut.handleContentItem(items[0], callback);
                }, 
                function (callback) { 
                    sut.handleContentItem(items[1], callback);
                }, 
                function (callback) { 
                    sut.handleContentItem(items[2], callback);
                }, 
                function (callback) { 
                    sut.end(null, function () { callback(); });
                }
            ], 
            function (err, results) {
                testApp.close();
                // ASSERT - todo once error handleing has been defined assrt it here
                
                done();
            }
        );        
    });
});
