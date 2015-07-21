var sutPath = '../../out/instrument/build/search-page-creating-content-handler';

describe('search-page-creating-content-handler', function() {

    var tempDir;
    var fs = require('fs');
    var yaml = require('js-yaml');

    beforeEach(function(done) {
        console.log('before');

        var temp = require('temp');
        temp.mkdir('',
            function(err, dirPath) {
                console.log('-------------------------------');
                console.log('dirPath=' + dirPath);
                tempDir = dirPath;
                done();
            }
        );
    });

    function item(url) {
        return {
            url: url,
            contentItem: {},
            siteItems: ['site-item-1', 'site-item-2']
        };
    }

    it('green path', function(done) {

        // ARRANGE
        var items = [
            item('/item1')
        ];

        var sut = require(sutPath)(tempDir);
        var expectedContent = '---\n' + yaml.dump({
            "name": "search",
            "contentItem": {
                "title": "Search Results",
                "summary": "Search results page"
            },
            "layout": "search.hbs",
            "siteItems": ['site-item-1', 'site-item-2']
        }) + '---\n';

        // ACT - manually drive the handler
        var cb = function() {};
        sut.start(cb);
        items.forEach(function(item) {
            sut.handleContentItem(item, cb);
        });
        sut.end(null, function() {
            // ASSERT - the temp directory should contain the expected files
            var expectedFilename = tempDir + '/search.yaml';
            expect(fs.existsSync(expectedFilename)).toEqual(true);
            var actualContent = fs.readFileSync(expectedFilename, 'UTF-8');
            expect(actualContent).toEqual(expectedContent);
            done();
        });


    });
});
