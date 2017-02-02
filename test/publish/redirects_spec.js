var sutPath = '../../out/instrument/publish/redirects';
describe('redirects', function() {

    var fs = require('fs-extra');
    var getRuntime = function() {
        return {
            referenceData: {},
            config: {},
            templates: {
                render: {}
            }
        }
    };

    it('green path', function(done) {

        var runtime = getRuntime();

        // ARRANGE
        var redirects = [{
            url: '/url1/',
            alias: '/url1/alias1'
        }, {
            url: '/url1/',
            alias: '/url1/alias2'
        }, {
            url: '/url2/with/path/',
            alias: '/url2'
        }];

        var sut = require(sutPath)(runtime, '/tmp/');

        var expectedContent = 'rewrite ^/url1/alias1(/?|/.*)$ /url1$1 permanent ;\n' +
            'rewrite ^/url1/alias2(/?|/.*)$ /url1$1 permanent ;\n' +
            'rewrite ^/url2(/?|/.*)$ /url2/with/path$1 permanent ;\n';

        sut.create(redirects, function() {
            // ASSERT - the temp directory should contain the expected files
            expect(fs.existsSync('/tmp/urlAliases.txt')).toEqual(true);
            var actualContent = fs.readFileSync('/tmp/urlAliases.txt', 'UTF-8');
            expect(actualContent).toEqual(expectedContent);
            done();
        });
    });
});