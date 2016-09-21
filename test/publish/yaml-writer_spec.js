var sutPath = '../../out/instrument/publish/yaml-writer';

describe('yaml-writer', function() {

    var fs = require('fs-extra');

    function item(id, url, format, markdown) {
        return {
            url: url,
            layout: 'layout.hbs',
            contentItem: {
                uuid: id,
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
                fundingBusinessStage: 'stage',
            },
            descendants: [ { descendants : []}]
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
            item('01', '/ignore/me/', 'STRUCTURAL_CATEGORY_LIST'),
            item('02', '/multi/segement/url/', 'CATEGORY_LIST'),
            item('03', '/single-segment-url/', 'ARTICLE'),
            item('04', '/organisations/', 'ORG_LIST'),
            item('05', '/guide/', 'GUIDE', '#Page One\n#Page Two\n#Page Three'),

            // items with special handling
            item('06', '/single-segment-url/', 'FUNDING_OPPORTUNITY'),
            item('07', '/single-segment-url/', 'FUNDING_LIST'),
            item('08', '/press-release-url/', 'PRESS_RELEASE'),
            item('09', '/press-release-landing-url/', 'PRESS_RELEASE_LANDING_PAGE'),
            item('10', '/publication-url/', 'APS_PUBLICATION'),
            item('11', '/publication-landing-url/', 'PUBLICATION_LANDING')

        ];

        var yamlDir = 'out/contentitems';
        var pagesDir = 'out/pages';
        fs.mkdirsSync(yamlDir);
        fs.mkdirsSync(pagesDir);
        var sut = require(sutPath)(yamlDir);

        // ACT - manually drive the handler
        var cb = function() {};
        sut.start(cb);
        items.forEach(function(item) {
            sut.handleContentItem(item, cb);
        });
        sut.end(null, function () {
            // ASSERT - the temp directory should contain the expected files
            expect(fs.existsSync(yamlDir + '/01.yaml')).toEqual(false);
            expect(fs.existsSync(yamlDir + '/02.yaml')).toEqual(true);
            expect(fs.existsSync(yamlDir + '/03.yaml')).toEqual(true);

            expect(fs.existsSync(pagesDir + '/multi/segement/url/index.yaml')).toEqual(true);
            expect(fs.existsSync(pagesDir + '/single-segment-url/index.yaml')).toEqual(true);
            expect(fs.existsSync(pagesDir + '/organisations/index.yaml')).toEqual(true);
            expect(fs.existsSync(pagesDir + '/guide/index.yaml')).toEqual(true);

            expect(fs.existsSync(pagesDir + '/press-release-url/index.yaml')).toEqual(true);
            expect(fs.existsSync(pagesDir + '/press-release-landing-url/index.yaml')).toEqual(true);
            expect(fs.existsSync(pagesDir + '/publication-url/index.yaml')).toEqual(true);
            expect(fs.existsSync(pagesDir + '/publication-landing-url/index.yaml')).toEqual(true);

            done();
        });
    });

    describe('items with special handling', function () {

        var yamlDir,
            pagesDir,
            sut,
            cb;

        beforeEach(function () {
            yamlDir = 'out/contentitems';
            pagesDir = 'out/pages';
            fs.mkdirsSync(yamlDir);
            fs.mkdirsSync(pagesDir);
            sut = require(sutPath)(yamlDir);

            // ACT - manually drive the handler
            cb = function() {};
            sut.start(cb);
        });

        it ('PERSON', function (done) {
            var item01 = item('person01', '/person01/', 'PERSON');
            var item02 = item('person02', '/person02/', 'PERSON');

            item02.contentItem.roleType = 'Listed';

            sut.handleContentItem(item01, cb);
            sut.handleContentItem(item02, cb);

            sut.end(null, function () {
                // ASSERT - the temp directory should contain the expected files
                expect(fs.existsSync(yamlDir + '/person01.yaml')).toEqual(true);
                expect(fs.existsSync(yamlDir + '/person02.yaml')).toEqual(true);

                expect(fs.existsSync(pagesDir + '/person01/index.yaml')).toEqual(true);
                expect(fs.existsSync(pagesDir + '/person02/index.yaml')).toEqual(false);

                done();
            });
        });

        it ('should determine the minimum date for PRESS_RELEASE content items for use on the PRESS_RELEASE_LANDING_PAGE', function(done) {
            var item01 = item('press01', '/press01/', 'PRESS_RELEASE_LANDING_PAGE');
            var item02 = item('press02', '/press02/', 'PRESS_RELEASE');
            var item03 = item('press03', '/press03/', 'PRESS_RELEASE');
            var item04 = item('press04', '/press04/', 'PRESS_RELEASE');

            item03.contentItem.pressReleaseDateTime = '2015-11-11';
            item04.contentItem.pressReleaseDateTime = '2016-11-11';

            sut.handleContentItem(item01, cb);
            sut.handleContentItem(item02, cb);
            sut.handleContentItem(item03, cb);
            sut.handleContentItem(item04, cb);

            sut.end(null, function () {

                expect(fs.existsSync(pagesDir + '/press01/index.yaml')).toEqual(true);

                done();
            });
        });

        it ('should determine the minimum date for APS_PUBLICATION content items for use on the PUBLICATION_LANDING page', function(done) {
            var item01 = item('publication01', '/publication01/', 'PUBLICATION_LANDING');
            var item02 = item('publication02', '/publication02/', 'APS_PUBLICATION');
            var item03 = item('publication03', '/publication03/', 'APS_PUBLICATION');
            var item04 = item('publication04', '/publication04/', 'APS_PUBLICATION');

            item03.contentItem.publicationDate = '2015-11-11';
            item04.contentItem.publicationDate = '2016-11-11';

            sut.handleContentItem(item01, cb);
            sut.handleContentItem(item02, cb);
            sut.handleContentItem(item03, cb);
            sut.handleContentItem(item04, cb);

            sut.end(null, function () {

                expect(fs.existsSync(pagesDir + '/publication01/index.yaml')).toEqual(true);

                done();
            });
        });

        it ('should only create a SITE_ITEM if it is not being used as a signpost', function(done) {
            var item01 = item('site01', '/site01/', 'SITE_ITEM');
            var item02 = item('site02', '/site02/', 'SITE_ITEM');

            item01.contentItem.signpostUrl = null;
            item02.contentItem.signpostUrl = 'foo';

            sut.handleContentItem(item01, cb);
            sut.handleContentItem(item02, cb);

            sut.end(null, function () {

                expect(fs.existsSync(pagesDir + '/site01/index.yaml')).toEqual(true);
                expect(fs.existsSync(pagesDir + '/site02/index.yaml')).toEqual(false);

                done();
            });
        });
    });

});
