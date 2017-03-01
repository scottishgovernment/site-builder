'use strict';

// Grunt task that fetches decommisioned sites and writes out the necessary nginx config files
module.exports = function(grunt) {

    var config = require('config-weaver').config();

    var name = 'create-decommissioned-site-redirects';
    var description = 'generate nginx config for decommissioned sites';

    grunt.registerTask(name, description, function() {
        var release = this.async();
        // var dir = grunt.config('site.nginx');
        // config.nginx = dir;
        var decommissioner = require('../decommission/decommissioner')(config);
        decommissioner.createRedirects(release, function (err) {
            if (err !== undefined) {
                grunt.fail.warn('Unable to create nginx redirects: ' + JSON.stringify(err));
            }
            release();
        });
    });

};
