'use strict';

// Grunt task that generates sitemaps based on the out content items directory
module.exports = function(grunt) {

    grunt.registerTask('create-sitemaps', 'generate sitemaps from the out/pages directory',
        function() {
            var config = require('config-weaver').config();
            var done = this.async();
            var generator = require('../publish/sitemap-generator');
            generator(config.tempdir, config.homepage, done);
        }
    );
};
