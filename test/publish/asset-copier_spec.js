var sutPath = '../../out/instrument/publish/asset-copier';
//var sutPath = '../../publish/asset-copier';

describe('asset-copier', function() {

    var tempDir;
    var fs = require('fs-extra');

    function createTestDir(testname) {
        tempDir = 'out/test/asset-copier/' + testname;
        fs.ensureDirSync(tempDir);
    };

    var testPort = 10000;

    it('green path', function(done) {

        // ARRANGE
        createTestDir('greenpath');
        var index = {
            '/image1.jpg': '/image1.jpg',
            '/image2.jpg': '/image2.jpg'
        };

        // start a test server to retuern dummy data
        var testServer = require('./test-assets-server')({
            '/routed/image1.jpg': '/routed/image1.jpg',
            '/routed/image2.jpg': '/routed/image2.jpg',
        });
        var testApp = testServer.startServer(testPort);

        // route requests to the test server
        var router = simpleRouter('http://localhost:'+testPort+'/');
        var sut = require(sutPath).create(router);

        // ACT
        sut.on('done', function (err) {

            // assert that all the expected files exist
            expect(fs.existsSync(tempDir + '/image1.jpg')).toEqual(true);
            expect(fs.existsSync(tempDir + '/image2.jpg')).toEqual(true);
            testApp.close();
            done();
        });

        // start the copy
        sut.copy(index, tempDir);
    });

    it('skips unroutable assets', function(done) {

        // ARRANGE
        createTestDir('skipsunroutableassets');
        var index = {
            '/image1.jpg': '/image1.jpg',
            '/image2.jpg': '/image2.jpg'
        };
        var sut = require(sutPath).create(
            stupidRouter('http://localhost:'+testPort+'/')
        );

        // ACT
        var skippedUrls = [];
        sut.on('skipped', function (skippedUrl) {
            skippedUrls.push(skippedUrl);
        });

        sut.on('done', function (err) {
            // ASSERT
            expect(skippedUrls).toEqual(['/image1.jpg', '/image2.jpg']);
            done();
        });

        // start the copy
        sut.copy(index, tempDir);
    });


    it('404 is skipped', function(done) {

        // ARRANGE
        createTestDir('skips404s');
        var index = {
            '/image1.jpg': '/image1.jpg',
            '/image2.jpg': '/image2.jpg'
        };

        // start a test server to retuern dummy data
        var testServer = require('./test-assets-server')({});
        var testApp = testServer.startServer(testPort);

        // route requests to the test server
        var router = simpleRouter('http://localhost:'+testPort+'/');
        var sut = require(sutPath).create(router);
        var skipped = [];

        // ACT
        sut.on('skipped', function (assetUrl, reason) {
            skipped.push(assetUrl);
        });
        sut.on('done', function (err) {

            // assert that all the expected files exist
            expect(err).toEqual(null);
            expect(skipped[0]).toEqual('/image1.jpg');
            expect(skipped[1]).toEqual('/image2.jpg');
            testApp.close();
            done();
        });

        // start the copy
        sut.copy(index, tempDir);
    });

    it('Failure to create directory causes error', function(done) {
        // ARRANGE
        createTestDir('failtocreatedircauseserror');
        var index = {
            '/blocked/image1.jpg': '/blocked/image1.jpg',
            '/blocked/image2.jpg': '/blocked/image2.jpg'
        };
        // note, we are not starting a test server

        // create a file that has the name of the directory we want to create
        fs.writeFileSync(tempDir + '/blocked', 'block from creating a directory');

        // route requests to the test server
        var router = simpleRouter('http://localhost:'+testPort+'/');
        var sut = require(sutPath).create(router);

        // ACT
        sut.on('done', function (err) {

            // assert that all the expected files exist
            expect(err).not.toEqual(null);
            done();
        });

        // start the copy
        sut.copy(index, tempDir);
    });


    it('http error causes error (server not running)', function(done) {

        // ARRANGE
        createTestDir('httperrorcauseserror');
        var index = {
            '/image1.jpg': '/image1.jpg',
            '/image2.jpg': '/image2.jpg'
        };

        // note, we are not starting a test server

        // route requests to the test server
        var router = simpleRouter('http://localhost:'+testPort+'/');
        var sut = require(sutPath).create(router);

        // ACT
        sut.on('done', function (err) {

            // assert that all the expected files exist
            expect(err).not.toEqual(null);
            done();
        });

        // start the copy
        sut.copy(index, tempDir);
    });


    // router that just apends /routed to every url
    function simpleRouter(baseUrl) {
        return function (req, callback) {
            var routedUrl = baseUrl + 'routed' + req.url;
            callback(require('url').parse(routedUrl));
        };
    }

    // a router that doesnt know how to rout anything
    function stupidRouter(baseUrl) {
        return function (req, callback) {
            callback(null);
        };
    }

});
