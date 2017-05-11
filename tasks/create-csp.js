'use strict';

/**
 * Grunt task that writes the content-security-policy nginx header.
 **/
module.exports = function(grunt) {
    var name = 'create-csp-header';
    var description = 'generate nginx config for content security policy header';

    grunt.registerTask(name, description, function () {
        var config = require('config-weaver').config();
        var done = this.async();
        var csp = require('../publish/csp').create(config.tempdir);
        csp.writeHeader(done);
    });
};
