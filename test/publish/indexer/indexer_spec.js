var sutPath = '../../../out/instrument/publish/indexer/indexer';
//var sutPath = '../../../publish/indexer/indexer';

describe('indexer_spec', function() {
// create a directory of content
//....include some yaml, some json
//....include some searchable some not
// setup a fake server to index against.
// record all urls
// assert that we indexed the right things...
//

    var path = require('path');
    var fs = require('fs');

    var tempDir;

    beforeEach(function(done) {
        var temp = require('temp');
        temp.mkdir('',
            function(err, dirPath) {
                tempDir = dirPath;
                done();
            }
        );
    });

    function createSrcDir(dir, inputs) {
        console.log('createSrcDir:', dir);
        inputs.forEach(function (input) {
            var filename = path.resolve(dir, input.uuid + '.json');
            fs.writeFileSync(filename, JSON.stringify(input, null, '\t'));
        });
    }

    function item(uuid, siteSearchable) {
        var ret = {
            uuid: uuid,
            contentItem: {
                _embedded: {
                    format: {
                        name: 'ARTICLE',
                        _embedded: {
                            siteSearchable : siteSearchable
                        }
                    }
                }
            }
        };

        return ret;
    }

    function siteSearchableFixture() {
        return item('siteSearchableFixture', true);
    }

    function notSiteSearchableFixture() {
        return item('notSiteSearchableFixture', false);
    }

    function testInputs() {
        var inputs = [];
        inputs.push(siteSearchableFixture());
        inputs.push(notSiteSearchableFixture());
        return inputs;
    }

    function recordingRestler() {
        return {
            posts: {},
            puts: {},

            putJson : function (url, data) {

                this.puts[url] = data;
                return {
                    on: function (event, callback) {
                        callback({}, { statusCode: 200 });
                    }
                }
            },

            postJson : function (url, data) {
                this.posts[url] = data;
                return {
                    on: function (event, callback) {
                        callback({}, { statusCode: 200 });
                    }
                }
            }
        }
    }

    it('greenpath', function (done) {

        // ARRANGE
        createSrcDir(tempDir, testInputs());
        var searchUrl = 'http://search/';
        var sut = require(sutPath).create();
        // use a formatter that does nothing to simplify tests: the formatter has its own unit tests.
        sut.formatter = {
            format : function (item, srddir, callback) {
                callback(item);
            }
        };
        var restler = recordingRestler();
        sut.restler = restler;

        // ACT
        var startCalled = false;
        var indexedCalled = false;
        var skippedCalled = false;

        sut
            .on('start',  function () { startCalled = true; })
            .on('indexed', function () { indexedCalled = true; })
            .on('skipped', function () { skippedCalled = true; })
            .on('done',  function () {
                // ASSERT
                expect(startCalled).toEqual(true);
                expect(indexedCalled).toEqual(true);
                expect(skippedCalled).toEqual(true);

                expect(restler.puts[searchUrl+'siteSearchableFixture']).not.toBeNull();
                expect(restler.posts[searchUrl+'siteIndexBegin']).not.toBeNull();
                expect(restler.posts[searchUrl+'siteIndexEnd']).not.toBeNull();
                done();
            }).index(tempDir, searchUrl);
    });
});
