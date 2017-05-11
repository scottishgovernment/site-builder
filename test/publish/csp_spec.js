var cspPath = require("../../out/instrument/publish/csp");
// var cspPath = require("../../publish/csp");

describe('CSP', function(){
  
    var path = require('path');
    var temp = require('temp').track();
    var fs = require('fs-extra');

    var tempDir,
        csp,
        outputPath,
        jsonPath = __dirname + '/resources/csp.json';

    beforeEach(function(done) {
        temp.mkdir('CSP_test', function(err, dirPath) {
            tempDir = dirPath;
            csp = cspPath.create(tempDir, jsonPath);
            outputPath = path.join(tempDir, 'nginx', 'csp.conf');
            done();
        });
    });

    it('should create the output directory if it does not exist', function(done) {
        var parent = path.dirname(outputPath);
        csp.writeHeader(function() {
            expect(fs.existsSync(parent)).toEqual(true);
            done();
        });
    });

    it('should exit without writing if no JSON template', function(done) {
        csp = cspPath.create(tempDir);
        csp.writeHeader(function() {
            expect(fs.existsSync(outputPath)).toEqual(false);
            done();
        });
    });

    it('should write an nginx configuration file', function(done) {
        csp.writeHeader(function() {
            expect(fs.existsSync(outputPath)).toEqual(true);
            done();
        });
    });

    it('should contain contents of template', function(done) {
        csp.writeHeader(function() {
            var header = fs.readFileSync(outputPath, 'UTF-8');
            expect(header).toContain('script-src');
            expect(header).toContain('img-src');
            done();
        });
    });

});
