'use strict';

module.exports = function(grunt) {

    var path = require('path');
    var log = grunt.log;

    grunt.registerTask('handlebars', '', function() {
        var render = require('../render/render.js');
        var cb = this.async();
        var layouts = path.join(process.cwd(), 'resources/templates/_layouts');
        var partials = path.join(process.cwd(), 'resources/templates/_partials');
        var helpers = path.join(process.cwd(), 'resources/_helpers');
        render.init(layouts, partials, helpers);
        render.on('render', function(src, dst, item) {
            grunt.log.writeln("Assembling " + dst.cyan);
        });
        render.run(cb);
    });

};
