'use strict';

module.exports = function(grunt) {

    var path = require('path');

    /**
     * Grunt task to generate HTML from YAML files.
     * It is assumed that the YAML files are already on disk.
     */
    grunt.registerTask('handlebars', '', function() {
        var render = require('../render/render.js');
        var done = this.async();
        var config = require('config-weaver').config();
        var layouts = path.join(process.cwd(), 'resources/templates/_layouts');
        var partials = path.join(process.cwd(), 'resources/templates/_partials');
        var helpers = path.join(process.cwd(), 'resources/_helpers');
        var renderer = new render.Renderer(layouts, partials, helpers, config.tempdir);
        renderer.on('render', function(src, dst, item) {
            grunt.log.writeln('Assembling ' + item.uuid + ' ' + dst.cyan);
        });
        var site = require('../publish/site.js');
        var siteBuilder = new site.Site(config.tempdir, renderer);
        siteBuilder.build(done);
    });

};
