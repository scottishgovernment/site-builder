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
      descendants: [{
        descendants: []
      }]
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
      item('06', '/single-segment-url/', 'FUNDING_OPPORTUNITY'),
      item('07', '/single-segment-url/', 'FUNDING_LIST')
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
    sut.end(null, function() {
      // ASSERT - the temp directory should contain the expected files
      expect(fs.existsSync(yamlDir + '/01.yaml')).toEqual(true);
      expect(fs.existsSync(yamlDir + '/02.yaml')).toEqual(true);
      expect(fs.existsSync(yamlDir + '/03.yaml')).toEqual(true);

      expect(fs.existsSync(pagesDir + '/multi/segement/url/index.yaml')).toEqual(true);
      expect(fs.existsSync(pagesDir + '/single-segment-url/index.yaml')).toEqual(true);
      expect(fs.existsSync(pagesDir + '/organisations/index.yaml')).toEqual(true);
      expect(fs.existsSync(pagesDir + '/guide/index.yaml')).toEqual(true);
      done();
    });
  });
});
//
//
// //var sutPath = '../../out/instrument/publish/yaml-writer';
// var sutPath = '../../publish/yaml-writer';
// describe('yaml-writer', function() {
//
//     var fs = require('fs-extra');
//
//     function item(id, url, format, markdown) {
//         return {
//             url: url,
//             layout: 'layout.hbs',
//             contentItem: {
//                 uuid: id,
//                 "_embedded": {
//                     format: {
//                         name: format
//                     },
//                 },
//                 content: markdown,
//                 fundingBusinessSectors: ['b1', 'b2'],
//                 regions: [{
//                     name: 'r1'
//                 }, {
//                     name: 'r1'
//                 }],
//                 fundingBusinessStage: 'stage',
//                 pdfUUID: 'abd-124',
//             },
//             descendants: [ { descendants : []}]
//         }
//     }
//
//     var tempDir;
//
//     beforeEach(function(done) {
//         var temp = require('temp');
//         temp.mkdir('',
//             function(err, dirPath) {
//                 tempDir = dirPath;
//                 done();
//             }
//         );
//     });
//
//     it('green path', function(done) {
//
//         var testDoctorServer = require('./test-doctor-server')();
//         testDoctorServer.startServer(6573, function(server){
//
//             console.log("DOCTOR server started");
//
//             var async = require('async');
//
//             // ARRANGE
//             var items = [
//                 // should be ignored
//                 item('01', '/ignore/me/', 'STRUCTURAL_CATEGORY_LIST'),
//                 item('02', '/multi/segement/url/', 'CATEGORY_LIST'),
//                 item('03', '/single-segment-url/', 'ARTICLE'),
//                 item('04', '/organisations/', 'ORG_LIST'),
//                 item('05', '/guide/', 'GUIDE', '#Page One\n#Page Two\n#Page Three'),
//                 item('06', '/single-segment-url/', 'FUNDING_OPPORTUNITY'),
//                 item('07', '/single-segment-url/', 'FUNDING_LIST'),
//                 item('08', '/pdf/', 'PDF_COVER_PAGE')
//             ];
//
//             var yamlDir = 'out/contentitems';
//             var pagesDir = 'out/pages';
//             fs.mkdirsSync(yamlDir);
//             fs.mkdirsSync(pagesDir);
//             var sut = require(sutPath)(yamlDir);
//
//             // ACT - manually drive the handler
//             sut.start(function(){
//                 console.log("Started content handling...");
//             });
//             async.each(items, function(item, cb) {
//                 sut.handleContentItem(item, function(){
//                     console.log("Finished handling "+item.contentItem._embedded.format.name);
//                     cb();
//                 });
//             },
//             function(){
//                 console.log('Stopping doctor server');
//                 server.close();
//                 sut.end(null, function () {
//
//                     // ASSERT - the temp directory should contain the expected files
//                     expect(fs.existsSync(yamlDir + '/01.yaml')).toEqual(true);
//                     expect(fs.existsSync(yamlDir + '/02.yaml')).toEqual(true);
//                     expect(fs.existsSync(yamlDir + '/03.yaml')).toEqual(true);
//
//                     expect(fs.existsSync(pagesDir + '/multi/segement/url/index.yaml')).toEqual(true);
//                     expect(fs.existsSync(pagesDir + '/single-segment-url/index.yaml')).toEqual(true);
//                     expect(fs.existsSync(pagesDir + '/organisations/index.yaml')).toEqual(true);
//                     expect(fs.existsSync(pagesDir + '/guide/index.yaml')).toEqual(true);
//                     done();
//                 });
//             });
//         });
//
//     });
// });
