var sutPath = '../../out/instrument/build/yaml-writing-content-handler';
describe('yaml-writing-content-handler', function() {

    var fs = require('fs-extra');

    function item(url, format, markdown) {
        return {
            url: url,
            contentItem: {
                "_embedded": {
                    format: {
                        name: format
                    },
                },
                content: markdown,
                fundingBusinessSectors: ['b1', 'b2'],
                regions: [{
                    name: 'r1'
                }, {
                    name: 'r1'
                }],
                fundingBusinessStage: 'stage'
            }
        }
    }

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

    it('green path', function(done) {

        // ARRANGE
        var items = [
            // should be ignored
            item('/ignore/me', 'STRUCTURAL_CATEGORY_LIST'),
            item('/multi/segement/url', 'CATEGORY_LIST'),
            item('/single-segment-url', 'ARTICLE'),
            item('/organisations', 'ORG_LIST'),
            item('/guide', 'GUIDE', '#Page One\n#Page Two\n#Page Three'),
            item('/single-segment-url', 'FUNDING_OPPORTUNITY'),
            item('/single-segment-url', 'FUNDING_LIST')
        ];

        var rootDir = tempDir + '/contentitems';
        var sut = require(sutPath)(rootDir);

        // ACT - manually drive the handler
        var cb = function() {};
        sut.start(cb);
        items.forEach(function(item) {
            sut.handleContentItem(item, cb);
        });
        sut.end(null, function () {
            // ASSERT - the temp directory should contain the expected files
            expect(fs.existsSync(rootDir + '/multi/segement/url/index.yaml')).toEqual(true);
            expect(fs.existsSync(rootDir + '/single-segment-url/index.yaml')).toEqual(true);
            expect(fs.existsSync(rootDir + '/organisations/index.yaml')).toEqual(true);
            expect(fs.existsSync(rootDir + '/guide/index.yaml')).toEqual(true);    
            done();
        });
    });
});
