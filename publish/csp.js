'use strict';

var fs = require('fs-extra');
var path = require('path');

function Csp(tempDir, jsonPath) {
    this.tempDir = tempDir;
    this.cspDir = path.join(this.tempDir, 'nginx');
    this.cspFile = path.join(this.cspDir, 'csp.conf');

    // Can optionally accept a different template path
    this.jsonPath = jsonPath || 'resources/csp.json';
}

/**
 * Assembles then writes a CSP header to an nginx
 * configuration file for inclusion in site headers.
 */
Csp.prototype.writeHeader = function(done) {
    if (!fs.existsSync(this.jsonPath)) {
        console.log('No CSP template found. CSP header not written.');
        return done();
    }

    console.log('Building CSP header.');

    var json = fs.readFileSync(this.jsonPath, 'UTF-8');
    var template = JSON.parse(json);

    // Add any additional CSP directives required from template here.
    var directives = [
      'script-src',
      'img-src',
      'style-src',
      'font-src',
      'frame-src',
      'object-src',
      'report-uri'
    ];

    var clauses = [];
    for (var i = 0; i < directives.length; i++) {
        var directive = directives[i];
        if (template[directive]) {
            clauses.push(directive + ' ' + template[directive].join(' '));
        }
    }
    var header = '';
    if (clauses.length) {
        header = 'add_header Content-Security-Policy "' +
            clauses.join('; ') +
            '";';
    }

    fs.mkdirsSync(this.cspDir);
    fs.writeFileSync(this.cspFile, header, 'UTF-8');

    done();
};

function create(tempDir, jsonPath) {
    return new Csp(tempDir, jsonPath);
}

module.exports = {
    create: create
};
