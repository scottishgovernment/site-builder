'use strict';

// Grunt task that fetches decommisioned sites and writes out the necessary nginx config files
module.exports = function(grunt) {

    var config = require('config-weaver').config();

    grunt.registerTask('create-decommissioned-site-redirects', 'generate nginx config for decommissioned sites',
        function() {
            var release = this.async();
            var dir = grunt.config('site.nginx');
            config.nginx = dir;
            var decommissioner = require('../decommission/decommissioner')(config);
            decommissioner.createRedirects(release,
                function (err) {
                    if (err !== undefined) {
                        grunt.fail.warn('Unable to create nginx redirects: ' + JSON.stringify(err));
                    }
                    release();
                });
        }
    );

};
