'use strict';

// Grunt task that indexes content in out/contentitems
module.exports = function(grunt) {

    var indexed = 0;
    var skipped = 0;

    function onStart(srcdir) {
        grunt.log.writeln('Indexing ', srcdir['cyan']);
    }

    function onIndexed(url) {
        grunt.log.writeln('Indexed ', url['cyan'], ' OK'['green']);
        indexed++;
    }

    function onInfo(msg) {
        grunt.log.writeln('Index content: ', msg['cyan']);
        indexed++;
    }

    function onSkipped() {
        skipped++;
    }

    function onDone(errs, done) {
        if (errs) {
            grunt.log.error('Error indexing content:', JSON.stringify(errs, null, '\t'));
            done(false);
        } else {
            grunt.log.writeln('Index finshed'['green'],  '. ', indexed, 'indexed, ', skipped, 'skipped');
            done(true);
        }
        return;
    }

    grunt.registerTask('index-content', 'index content from site.contentitems',
        function() {
            var srcdir = grunt.config('site.contentitems'),
                config = require('config-weaver').config(),
                site = require('../common/site')(),
                indexer = require('../publish/indexer/indexer.js').create(config, site),
                done = this.async();
            indexer
                .on('start',  onStart)
                .on('indexed', onIndexed)
                .on('info', onInfo)
                .on('skipped', onSkipped)
                .on('done',  function (errs) { onDone(errs, done); })
                .index(srcdir);
        }
    );
};
