var sutPath = '../../out/instrument/publish/redirects';
describe('redirects', function() {

    var fs = require('fs-extra');

    it('green path', function(done) {

        // ARRANGE
        var redirects = [{
            alias: '/url1/alias1',
            url: '/url1/'
        }, {
            alias: '/url1/alias2',
            url: '/url1/'
        }, {
            alias: '/url2',
            url: '/url2/with/path/'
        }, {
            alias: '/url3',
            url: '/no-trailing-slash'
        }, {
            alias: '/url4',
            url: 'https://external.url/index.html'
        }];

        var sut = require(sutPath)('/tmp/');

        var expectedContent = 'rewrite ^/url1/alias1/?$ /url1/ permanent ;\n' +
            'rewrite ^/url1/alias2/?$ /url1/ permanent ;\n' +
            'rewrite ^/url2/?$ /url2/with/path/ permanent ;\n' +
            'rewrite ^/url3/?$ /no-trailing-slash permanent ;\n' +
            'rewrite ^/url4/?$ https://external.url/index.html permanent ;\n';

        sut.create(redirects, function() {
            // ASSERT - the temp directory should contain the expected files
            expect(fs.existsSync('/tmp/nginx/urlAliases.txt')).toEqual(true);
            var actualContent = fs.readFileSync('/tmp/nginx/urlAliases.txt', 'UTF-8');
            expect(actualContent).toEqual(expectedContent);
            done();
        });
    });
});
