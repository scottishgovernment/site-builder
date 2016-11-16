    var sutPath = '../../out/instrument/publishing/content-source';
//var sutPath = '../../../unified/middleware/content-source';

describe('content-source', function() {

    // beforeEach(function() {
    //
    // });
    function anyConfig() {
        return {
            publishing: {
                endpoint: 'publishing/'
            },
            buildapi: {
                endpoint: 'buildapi/'
            }
        };
    }

    // a restler that returns content if it has some
    function successfulRestler(err, responses) {
        return {
            lastUrl: null,

            get : function (url, options) {
                this.lastUrl = url;
                return {
                    on: function (event, callback) {
                        var res = {
                            statusCode: 200
                        };

                        if (!responses[url]) {
                            throw 'Unrecognised url:' + url;
                        }
                        callback(JSON.stringify(responses[url], null, '\t'), res);
                    }
                }
            }
        }
    }

    // restlr that always returns a given status code
    function errorStatusRestler(status) {
        return {
            get : function (url, options) {
                return {
                    on: function (event, callback) {
                        callback(null, {statusCode : status});
                    }
                }
            }
        }
    }

    // a restler that always returns an error
    function errorRestler() {
        return {
            get : function (url, options) {
                return {
                    on: function (event, callback) {
                        callback(new Error('error'), {});
                    }
                }
            }
        }
    }

    // tests for urlsById
    describe('fetchUrlsById', function() {

        it('greenpath returns as expected', function (done) {

            // ARRANGE
            var config = anyConfig();
            var expectedResults = ['urlone', 'urltwo', 'urlthree'];
            var expectedUrl = 'publishing/items/urlsById?ids=one,two,three';
            var urlToResultMap = {};
            urlToResultMap[expectedUrl] = expectedResults;
            var restler = successfulRestler(null, urlToResultMap);

            var sut = require(sutPath)(anyConfig(), restler);
            var context = {};

            // ACT
            sut.fetchUrlsById(['one', 'two', 'three'], '', function (err, res) {

                // ASSERT
                expect(restler.lastUrl).toEqual(expectedUrl);
                expect(err).toBeFalsy();
                expect(res).toEqual(expectedResults);
                done();
            });
        });

        it('404 returns an error', function (done) {

            // ARRANGE
            var config = anyConfig();
            var expectedResults = ['urlone', 'urltwo', 'urlthree'];
            var expectedUrl = 'publishing/items/urlsById?ids=one,two,three';

            var restler = errorStatusRestler(404);
            var sut = require(sutPath)(anyConfig(), restler);
            var context = {};

            // ACT
            sut.fetchUrlsById(['one', 'two', 'three'], '', function (err, res) {

                // ASSERT
                expect(err).toBeTruthy();
                expect(res).toBeFalsy();
                done();
            });
        });

        it('error returns an error', function (done) {

            // ARRANGE
            var config = anyConfig();
            var expectedResults = ['urlone', 'urltwo', 'urlthree'];
            var expectedUrl = 'publishing/items/urlsById?ids=one,two,three';

            var restler = errorRestler();
            var sut = require(sutPath)(anyConfig(), restler);
            var context = {};

            // ACT
            sut.fetchUrlsById(['one', 'two', 'three'], '', function (err, res) {

                // ASSERT
                expect(err).toBeTruthy();
                expect(res).toBeFalsy();
                done();
            });
        });


        it('null ids throws exception', function () {

            // ARRANGE
            var sut = require(sutPath)(anyConfig());

            // ACT
            var thrown;
            try {
                sut.fetchUrlsById(null, '', function (err, res) {
                    fail();
                });
            } catch (ex) {
                thrown = ex;
            }

            // ASSERT
            expect(thrown).toEqual([]);
        });

        it('empty ids return empty array', function (done) {

            // ARRANGE
            var sut = require(sutPath)(anyConfig());
            var context = {};

            // ACT
            sut.fetchUrlsById([], '', function (err, res) {
                // ASSERT
                expect(err).toBeFalsy();
                expect(res).toEqual({});
                done();
            });
        });

    });

    // tests for items
    describe('item', function() {
        it('greenpath returns as expected', function (done) {

            // ARRANGE
            var config = anyConfig();
            var id = 'id';
            var expectedResults = { uuid: id };
            var expectedUrl = 'buildapi/urlOrId/id?visibility=preview';
            var urlToResultMap = {};
            urlToResultMap[expectedUrl] = expectedResults;
            var restler = successfulRestler(null, urlToResultMap);

            var sut = require(sutPath)(anyConfig(), restler);
            var context = {
                attributes: {
                    visibility: 'preview'
                }
            };

            // ACT
            sut.fetchItem(id, '', 'preview', function (err, res) {

                // ASSERT
                expect(restler.lastUrl).toEqual(expectedUrl);
                expect(err).toBeFalsy();
                expect(res).toEqual(expectedResults);
                done();
            });
        });
    });

    // tests for items
    describe('items', function() {
        it('greenpath returns as expected', function (done) {

            // ARRANGE
            var config = anyConfig();
            var id = 'id';
            var expectedResults = ['id1', 'id2'];
            var expectedUrl = 'buildapi/items/?visibility=preview';
            var urlToResultMap = {};
            urlToResultMap[expectedUrl] = expectedResults;
            var restler = successfulRestler(null, urlToResultMap);

            var sut = require(sutPath)(anyConfig(), restler);
    

            // ACT
            sut.fetchItems('', 'preview', function (err, res) {

                // ASSERT
                expect(restler.lastUrl).toEqual(expectedUrl);
                expect(err).toBeFalsy();
                expect(res).toEqual(expectedResults);
                done();
            });
        });
    });
});
