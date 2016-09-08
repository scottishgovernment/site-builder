'use strict';

var config = require('config-weaver').config();
var myArgs = require('optimist').argv;

// Grunt task that indexes content in out/contentitems
module.exports = function(grunt) {

    var indexed = 0;
    var skipped = 0;

    function onStart(srcdir, searchurl) {
        grunt.log.writeln('Indexing ', srcdir['cyan'], ' -> ', searchurl['cyan']);
    }

    function onIndexed(url) {
        grunt.log.writeln('Indexed ', url['cyan'], ' OK'['green']);
        indexed++;
    }

    function onSkipped() {
        skipped++;
    }

    function onDone(done) {
        grunt.log.writeln('Index finshed'['green'],  '. ', indexed, 'indexed, ', skipped, 'skipped');
        done();
    }

    grunt.registerTask('index-content', 'index content from site.contentitems',
        function() {

            var srcdir = grunt.config('site.contentitems'),
                searchUrl = config.search.endpoint;

            var done = this.async();

            var indexer = require('../publish/indexer/indexer.js').create();

            indexer
                .on('start',  onStart)
                .on('indexed', onIndexed)
                .on('skipped', onSkipped)
                .on('done',  function () { onDone(done); })
                .index(srcdir, searchUrl);

        }
    );
};
