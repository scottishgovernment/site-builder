var sutPath = '../../out/instrument/publish/sitemap-handler';
describe('sitemap-handler', function() {

    var fs = require('fs-extra'),
        glob = require('glob'),
        async = require('async');

    var dir = "out/sitemap/";

    function item(url, dateModified, ancestorUrls, format) {
        var ancestors = [];
        ancestorUrls.forEach(function(ancestorUrl) {
            ancestors.push({
                url: ancestorUrl
            });
        });
        return {
            url: url,
            ancestors: ancestors,
            contentItem: {
                title: url,
                dateModified: dateModified,
                _embedded: {
                    format: {
                        name: format
                    }
                },
                content: '#section one\ncontent of first section\n'
                    + '#section two\ncontent of second section\n'
                    + '#section three\ncontent of third section\n'
            }
        }
    }

    var tempDir;

    beforeEach(function(done) {
        // delete the sitemaps
        glob(dir + '**/sitemap*.xml', {}, function(err, files) {
            files.forEach(function(file) {
                fs.unlinkSync(file);
            });
            done();
        });
    });

    it('green path', function(done) {

        // ARRANGE
        var items = [
            // root
            item('/',
                '2014-12-03T00:00:00Z', [''], 'ARTICLE'),
            item('/root/',
                '2014-12-03T01:00:00Z', [''], 'STRUCTURAL_CATEGORY_LIST'),
            item('/search-results/',
                '2014-12-03T01:00:00Z', [''], 'SEARCH'),

            // benefits sitemap
            item('/benefits/benefits-item1/',
                '2014-12-03T00:00:00Z', ['/', '/benefits/'], 'ARTICLE'),
            item('/benefits/subcat/benefits-item2/',
                '2014-12-03T01:00:00Z', ['/', '/benefits/', '/benefits/subcat/'], 'ARTICLE'),
            item('/guide/',
                '2014-12-03T00:00:00Z', ['/', '/benefits/'], 'GUIDE'),

            // orgs sitemap
            item('/organisations/aberdeen-city-council/',
                '2014-12-03T00:00:00Z', ['/', '/organisations/'], 'ARTICLE'),
            item('/organisations/aberdeenshire-council/',
                '2014-12-03T01:00:00Z', ['/', '/organisations/'], 'ARTICLE'),
        ];

        var sut = require(sutPath)(dir, 'http://www.mygov.scot');

        // ACT - manually drive the handler
        var cb = function() {};
        sut.start(cb);
        items.forEach(function(item) {
            sut.handleContentItem(item, cb);
        });
        sut.end(null, function() {
            // ASSERT - the temp directory should contain the expected files
            glob(dir + '**/sitemap*.xml', {}, function(err, files) {
                // were the expected files created?
                expect(files.length).toEqual(4);
                expect(files).toContain(dir + 'sitemap.xml');
                expect(files).toContain(dir + 'sitemap.root.xml');
                expect(files).toContain(dir + 'sitemap.benefits.xml');
                expect(files).toContain(dir + 'sitemap.organisations.xml');

                var parser = new require('xml2js').Parser();
                async.series([
                        function(callback) {
                            fs.readFile(dir + 'sitemap.xml', function(err, data) {
                                parser.parseString(data, function(err, result) {
                                    expect(result.sitemapindex.sitemap[0].loc[0])
                                        .toEqual('https://www.mygov.scot/sitemap.root.xml');
                                    expect(result.sitemapindex.sitemap[1].loc[0])
                                        .toEqual('https://www.mygov.scot/sitemap.benefits.xml');
                                    expect(result.sitemapindex.sitemap[2].loc[0])
                                        .toEqual('https://www.mygov.scot/sitemap.organisations.xml');
                                    callback();
                                });
                            });
                        },

                        function(callback) {
                            fs.readFile(dir + 'sitemap.benefits.xml', function(err, data) {
                                parser.parseString(data, function(err, result) {

                                    expect(result.urlset.url.length).toEqual(6);

                                    expect(result.urlset.url[0].loc[0])
                                        .toEqual('https://www.mygov.scot/benefits/benefits-item1/');
                                    expect(result.urlset.url[1].loc[0])
                                        .toEqual('https://www.mygov.scot/benefits/subcat/benefits-item2/');
                                    expect(result.urlset.url[2].loc[0])
                                        .toEqual('https://www.mygov.scot/guide/');
                                    expect(result.urlset.url[3].loc[0])
                                        .toEqual('https://www.mygov.scot/guide/section-one/');
                                    expect(result.urlset.url[4].loc[0])
                                        .toEqual('https://www.mygov.scot/guide/section-two/');
                                    expect(result.urlset.url[5].loc[0])
                                        .toEqual('https://www.mygov.scot/guide/section-three/');

// <url><loc>https://www.mygov.scot/benefits/benefits-item1/</loc><lastmod>2014-12-03</lastmod></url>
// <url><loc>https://www.mygov.scot/benefits/subcat/benefits-item2/</loc><lastmod>2014-12-03</lastmod></url>
// <url><loc>https://www.mygov.scot/guide/</loc><lastmod>2014-12-03</lastmod></url>
// <url><loc>https://www.mygov.scot/guide/section-one/</loc><lastmod>2014-12-03</lastmod></url>
// <url><loc>https://www.mygov.scot/guide/section-two/</loc><lastmod>2014-12-03</lastmod></url>
// <url><loc>https://www.mygov.scot/guide/section-three/</loc><lastmod>2014-12-03</lastmod></url>

                                    callback();
                                });
                            });
                        },

                        function(callback) {
                            fs.readFile(dir + 'sitemap.root.xml', function(err, data) {
                                parser.parseString(data, function(err, result) {
                                    expect(result.urlset.url[0].loc[0])
                                        .toEqual('https://www.mygov.scot/');
                                    expect(result.urlset.url.length === 1);
                                    callback();
                                });
                            });
                        },

                    ],
                    function(err, results) {
                        done();
                    }
                );
            });
        });
    });
});
