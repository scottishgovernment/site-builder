var sutPath = '../../out/instrument/publish/indexing-content-handler';

describe('indexing-content-handler', function() {

    function item(url, format, siteSearchable, topics) {
        var item = {
            url : url,
            contentItem : {
                _embedded: {
                    format: {
                        name: format,
                        _embedded : {
                          siteSearchable: siteSearchable
                        }
                    }
                }
            }
        }
        if (topics) {
            item.contentItem._embedded.topics = topics;
        }
        return item;
    }

    var testPort = 9999;
    var testUrl = 'http://localhost:'+testPort+'/';
    var async = require('async');

    it('green path', function(done) {

        // ARRANGE
        var items = [
            item('/multi/segement/url', 'CATEGORY_LIST', false),
            item('/single-segment-url', 'ARTICLE', true, [{name: 'topic1'}, {name: 'topics2'}]),
            item('/organisations', 'ORG_LIST', true)
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
                console.log(JSON.stringify(testSearchServer.indexedItems(), null, '\t'));

                // ASSERT

                //expect(testSearchServer.wasSiteIndexBeginCalled()).toBe(true);
                expect(testSearchServer.wasSiteIndexEndCalled()).toBe(true);

                // each of the items were indexed
                expect(testSearchServer.indexedItems().length).toBe(2);
                done();
            }
        );
    });


    it('search server not running', function(done) {

        // ARRANGE
        var items = [
            item('/multi/segement/url', 'CATEGORY_LIST', false)
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
            item('/multi/segement/url', 'CATEGORY_LIST', false),
            item('/single-segment-url', 'ARTICLE', true),
            item('/organisations', 'ORG_LIST', true)
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
