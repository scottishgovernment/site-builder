var sutPath = '../../out/instrument/publish/redirect-writing-content-handler';
describe('redirect-writing-content-handler', function() {

    var fs = require('fs-extra');

    function item(url, aliases) {
        return {
            url: url,
            contentItem: {
                _embedded: {
                    urlaliases: aliases
                }
            }
        }
    }

    beforeEach(function() {
        fs.removeSync('redirects.txt');
    });

    it('green path', function(done) {

        // ARRANGE
        var items = [
            // should be ignored 
            item('/url1/', [{
                url: '/url1/alias1/'
            }, {
                url: '/url1/alias2/'
            }]),
            item('/url2/with/path/', [{
                url: '/url2/'
            }])
        ];

        var sut = require(sutPath)('/tmp/');

        var expectedContent = 'rewrite ^/url1/alias1/(.*)$ /url1/$1 permanent ;\n' +
            'rewrite ^/url1/alias2/(.*)$ /url1/$1 permanent ;\n' +
            'rewrite ^/url2/(.*)$ /url2/with/path/$1 permanent ;\n';

        // ACT - manually drive the handler
        var cb = function() {};
        sut.start(cb);
        items.forEach(function(item) {
            sut.handleContentItem(item, cb);
        });
        sut.end(null, function() {
            // ASSERT - the temp directory should contain the expected files
            expect(fs.existsSync('/tmp/urlAliases.txt')).toEqual(true);
            var actualContent = fs.readFileSync('/tmp/urlAliases.txt', 'UTF-8');
            expect(actualContent).toEqual(expectedContent);
            done();

        });

    });
});
