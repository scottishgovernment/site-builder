var sutPath = '../../out/instrument/publish/save-item';
//var sutPath = '../../../unified/site/save-item';

describe('save-item', function() {

    var temp = require('temp');
    var tempDir;
    var fs = require('fs');
    var path = require('path');
    var async = require('async');

    var runtime = {
        context: {
            resourceQueue: [],
            lists: { pressRelease: {}, publications: {} }
        },
        amphora: {
            utils: {
                downloadQueuedResources: function(apctx, callback) {
                    callback();
                }
            }
        }
    }

    beforeEach(function(done) {
        temp.mkdir('save-item',
            function(err, dirPath) {
                tempDir = dirPath;
                done();
            }
        );
    });

    // a sample content item with a given id and url.
    function item(uuid, url) {
        return {
            uuid: uuid,
            url: url,
            contentItem: {
                uuid: uuid,
                content: 'some markdown content',
                _embedded : {
                    format: {
                        name: 'article',
                        _embedded: {
                            siteSearchable: true
                        }
                    }
                }
            },
            relatedItems: {
                partOf: []
            }
        }
    }

    function expectedPathsForItem(item) {
        var paths = [];
        paths.push('/contentitems/' + item.uuid + '.json');
        paths.push('/pages/' + item.url + 'index.json');
        return paths;
    }

    // load an output file and parse it into a content item.
    function loadOutputFile(outputPath, cb) {
        var extension = outputPath.split('.').pop();

        fs.readFile(outputPath, function(err, contents) {
            var parsedContent;
            if (err) {
                throw err;
            }

            switch (extension) {
                case 'json':
                    parsedContent = JSON.parse(contents);
                    break;

                default:
                    fail('Unrecognised file extension:' + extension);
            }
            cb(parsedContent);
        });
    }

    function assertExpectations(expectations, done) {
        async.each(expectations,
            function(expectation, cb) {
                loadOutputFile(path.join(tempDir, expectation.path),
                    function(output) {
                        expect(output).toEqual(expectation.content);
                        cb();
                    }
                );
            },
            function() {
                done();
            }
        );
    }

    it('starts', function(done) {
        var called = {};
        var myFs = {
            mkdirs: function (f, cb) {
                called[f + 'create'] = true;
                cb();
            }
        };

        // ARRANGE
        var sut = require(sutPath)(runtime, tempDir, myFs);

        // ACT
        sut.start(function(err) {
            // ASSERT
            expect(called[tempDir + '/contentitemscreate']).toBe(true);
            expect(called[tempDir + '/pagescreate']).toBe(true);
            done();
        });
    });


    it('saves content with no additional items attribute', function(done) {

        // ARRANGE
        var sut = require(sutPath)(runtime, tempDir, require('fs-extra'));
        var input = item('test-id', '/test/url/');
        var context = {
            attributes: {
                'test-id': {
                    store: true
                }
            }
        };

        // the files that should have been created in the temp directory
        var expectations = [];
        expectedPathsForItem(input).forEach(function(path) {
            expectations.push({ path: path, content: input });
        });

        // ACT
        sut.handleContentItem(context, input, function(err) {

            // ASSERT
            assertExpectations(expectations, done);
        });

    });

    it('does not save= content if save attrib set to false', function(done) {

        // ARRANGE
        var sut = require(sutPath)(runtime, tempDir, require('fs-extra'));
        var input = item('test-id', '/test/url/');
        var context = {
            attributes: {
                'test-id': {
                    store: false
                }
            }
        };

        // the files that should have been created in the temp directory
        var expectations = [];
        // expectedPathsForItem(input).forEach(function (path) {
        //     expectations.push({path: path, content: input});
        // });

        // ACT
        sut.handleContentItem(context, input, function(err) {

            // ASSERT
            assertExpectations(expectations, done);
        });

    });

    it('saves content with empty additional items attribute', function(done) {

        // ARRANGE
        var sut = require(sutPath)(runtime, tempDir, require('fs-extra'));
        var input = item('test-id', '/test/url/');
        var context = {
            attributes: {
                'test-id': {
                    store: true,
                    additionalItems: { each: function(ecn, cb) { cb(); } }
                }
            }
        };

        // the files that should have been created in the temp directory
        var expectations = [];
        expectedPathsForItem(input).forEach(function(path) {
            expectations.push({ path: path, content: input });
        });

        // ACT
        sut.handleContentItem(context, input, function(err) {

            // ASSERT
            assertExpectations(expectations, done);
        });

    });

    xit('saves content with additional items', function(done) {

        // ARRANGE
        var sut = require(sutPath)(runtime, tempDir, require('fs-extra'));
        var input = item('test-id', '/test/url/');
        var additionalItem1 = item('test-id-additional1', '/test/url/additional-1/');
        var additionalItem2 = item('test-id-additional2', '/test/url/additional-2/');
        var context = {
            attributes: {
                'test-id': {
                    store: true,
                    additionalItems: {
                        each: function(ecb, cb) {
                            ecb(additionalItem1, function() {
                                ecb(additionalItem2, function() {
                                    cb();
                                })
                            })
                        }
                    }
                }
            }
        };

        // the files that should have been created in the temp directory
        var expectations = [];

        // files for the item
        [input, additionalItem1, additionalItem2].forEach(function(item) {
            expectedPathsForItem(item).forEach(function(path) {
                expectations.push({ path: path, content: item });
            });
        });

        // ACT
        sut.handleContentItem(context, input, function(err) {

            // ASSERT
            assertExpectations(expectations, done);
        });

    });

    it('end fails', function(done) {

        // ARRANGE
        var sut = require(sutPath)(runtime, tempDir, {});

        // ACT
        sut.end('failed', function(err) {
            expect(err).toBe('failed');
            done();
        });
    });

    it('ends gracefully without additional items', function(done) {
        // ARRANGE
        // add final content:
        runtime.context.funding = null;
        runtime.context.lists = { pressRelease: {}, publications: {} }

        var called = {};
        var myFs = {
            outputFile: function(p, c, cb) {
                called[p] = true;
                cb();
            }
        }

        var sut = require(sutPath)(runtime, tempDir, myFs);
        sut.end(null, function() {
            expect(called).toEqual({});
            done();
        });
    });

});
