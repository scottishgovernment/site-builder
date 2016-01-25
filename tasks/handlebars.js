'use strict';

module.exports = function(grunt) {

    var path = require('path');
    var log = grunt.log;

    grunt.registerTask('handlebars', '', function() {
        var render = require('../render/render.js');
        var done = this.async();
        var layouts = path.join(process.cwd(), 'resources/templates/_layouts');
        var partials = path.join(process.cwd(), 'resources/templates/_partials');
        var helpers = path.join(process.cwd(), 'resources/_helpers');
        var renderer = new render.Renderer(layouts, partials, helpers);
        renderer.on('render', function(src, dst, item) {
            grunt.log.writeln("Assembling " + item.uuid + " " + dst.cyan);
        });
        var site = require('../render/site.js');
        var siteBuilder = new site.Site('out/contentitems', 'out/pages', renderer);
        siteBuilder.build(done);
    });

};
