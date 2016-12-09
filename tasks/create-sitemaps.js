'use strict';

// Grunt task that generates sitemaps based on the out content items directory
module.exports = function(grunt) {

    grunt.registerTask('create-sitemaps', 'generate sitemaps from the out/pages directory',
        function() {
            var srcdir = grunt.config('site.pages');
            var targetdir = grunt.config('site.sitemap');
            var baseUrl = grunt.config('site.homepage');
            var done = this.async();
            var generator = require('../publish/sitemap-generator');
            generator(srcdir, targetdir, baseUrl, done);
        }
    );
};
