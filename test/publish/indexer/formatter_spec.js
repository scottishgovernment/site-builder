var sutPath = '../../../out/instrument/publish/indexer/formatter';
//var sutPath = '../../../publish/indexer/formatter';
var sut = require(sutPath);

describe('formatter', function() {

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

    function item(formatname, topicNames, incumbent) {
        var ret = {
            url: 'url',
            filterDate: 'filterDate',
            contentItem: {
                title: 'item title',
                content: 'item content',
                additionalContent: 'item additionalContent',
                tags: ['tag1', 'tag2'],
                _embedded: {
                    format: {
                        name: formatname
                    }
                }
            },
            relatedItems: {
                hasIncumbent: [],
                partOf: []
            },
            inverseRelatedItems: {
                partOf: []
            }
        };

        if (topicNames) {
            ret.contentItem._embedded.topics = [];

            topicNames.forEach(function (topic) {
                //ret.contentItem._embedded.topics.push({ name: topic});
                ret.relatedItems.partOf.push({title: topic});
            });
        }

        if (incumbent) {
            ret.relatedItems.hasIncumbent.push({ uuid: incumbent});
        }
        return ret;
    }

    function addAutoComplete(item) {
        item.autocomplete = {
            input: item.title
        };
        return item;
    }

    it('non role', function(done) {

        // ARRANGE
        var input = item('ARTICLE', ['topic1', 'topic2']);
        var expected = JSON.parse(JSON.stringify(input)).contentItem;
        expected.url = 'url';
        expected.filterDate = 'filterDate';
        expected.topicNames = ['topic1', 'topic2'];
        expected._embedded.format.name = 'article';
        addAutoComplete(expected);

        //ACT
        sut.format(input, '/tmp', function (actual) {

            // ASSERT
            expect(actual).toEqual(expected);
            done();
        });


    });

    it('no topics', function(done) {

        // ARRANGE
        var input = item('ARTICLE', null);
        var expected = JSON.parse(JSON.stringify(input)).contentItem;
        expected.url = 'url';
        expected.filterDate = 'filterDate';
        expected.topicNames = [];
        expected._embedded.format.name = 'article';
        addAutoComplete(expected);

        //ACT
        sut.format(input, '/tmp', function (actual) {

            // ASSERT
            expect(actual).toEqual(expected);
            done();
        });
    });

    it('role with no incumbent', function(done) {

        // ARRANGE
        var input = item('ROLE', null);
        var expected = JSON.parse(JSON.stringify(input)).contentItem;
        expected.url = 'url';
        expected.filterDate = 'filterDate';
        expected.topicNames = [];
        expected._embedded.format.name = 'role';
        addAutoComplete(expected);

        //ACT
        sut.format(input, '/tmp', function (actual) {
            // ASSERT
            expect(actual).toEqual(expected);
            done();
        });
    });

    it('featured role with no incumbent', function(done) {

        // ARRANGE
        var input = item('FEATURED_ROLE', null);
        var expected = input;

        var expected = JSON.parse(JSON.stringify(input)).contentItem;
        expected.url = 'url';
        expected.filterDate = 'filterDate';
        expected.topicNames = [];
        expected._embedded.format.name = 'featured_role';
        addAutoComplete(expected);

        //ACT
        sut.format(input, '/tmp', function (actual) {

            // ASSERT
            expect(actual).toEqual(expected);
            done();
        });
    });

    it('featured role with non existant incumbent', function(done) {

        // ARRANGE
        var input = item('FEATURED_ROLE', null, 'does-not-exist');

        //ACT
        sut.format(input, '/tmp', function (actual) {

            // ASSERT
            expect(actual instanceof Error).toBe(true);
            done();
        });
    });

    function createTempFile(data) {
        var itemPath = require('path').resolve(tempDir, data.uuid + '.json');
        require('fs').writeFileSync(itemPath, JSON.stringify(data, null, '\t'));
    }

    it('featured role with incumbent', function(done) {

        // ARRANGE
        var input = item('ROLE', null, 'incumbent-uuid');

        var incumbent = {
            uuid: 'incumbent-uuid',
            contentItem: {
                title: 'item title',
                image: 'incumbent-image',
                content: 'incumbent content',
                additionalContent : 'incumbent additionalContent',
                tags: ['incumbent-tag1', 'incumbent-tag2']
            }
        };

        // create a tmp directory and write out incumbent
        createTempFile(incumbent);

        var expected = JSON.parse(JSON.stringify(input)).contentItem;
        expected.url = 'url';
        expected.incumbentTitle = 'item title';
        expected.image = 'incumbent-image';
        expected.filterDate = 'filterDate';
        expected.topicNames = [];
        expected._embedded.format.name = 'role';
        expected.tags = ['tag1', 'tag2', 'incumbent-tag1', 'incumbent-tag2'];
        expected.content = expected.content + '\n' + incumbent.contentItem.content;
        expected.additionalContent = expected.additionalContent + '\n' + incumbent.contentItem.additionalContent;
        addAutoComplete(expected);

        //ACT
        sut.format(input, tempDir, function (actual) {

            // ASSERT
            expect(actual).toEqual(expected);
            done();
        });
    });

});
