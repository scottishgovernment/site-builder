'use strict';

/**
 * Grunt task for indexing content with eleasticsearch.  There are two targets:
 *
 *   index-content:
 *      this target indexes the content contained in out/contentitems to the
 *      offline index.  It will also ensue that all of the required indices
 *      and aliases are present.
 *
 *   flip-aliases:
 *      this target switches the onlinecontent and offlinecontent aliases
 **/
module.exports = function(grunt) {
    grunt.registerMultiTask('elasticsearch', 'Elastic search management', function() {
        var config = require('config-weaver').config();
        var site = require('../common/site')();
        var done = this.async();

        switch (this.target) {
            case 'index-content' :
                indexContent(grunt, config, site, done);
            break;

            case 'flip-aliases' :
                flipAliases(grunt, config, site, done);
            break;

            default:
                grunt.log.error('Unsupported target: ', this.target);
                done(false);
        }
    });
};

function indexContent(grunt, config, site, done) {
    var indexed = 0;
    var skipped = 0;

    function onStart(srcdir) {
        grunt.log.writeln('Indexing ', srcdir['cyan']);
    }

    function onIndexed(items) {
        indexed += items.length;
    }

    function onInfo(msg) {
        grunt.log.writeln('Index content: ', msg['cyan']);
    }

    function onSkipped() {
        skipped++;
    }

    function onDone(errs) {
        if (errs) {
            grunt.log.error('Error indexing content:', JSON.stringify(errs, null, '\t'));
            done(false);
        } else {
            grunt.log.writeln('Index finshed'['green'], indexed, 'indexed, ', skipped, 'skipped');
            done(true);
        }
        return;
    }

    var indexer = require('../publish/indexer/indexer.js').create(config, site);
    indexer
        .on('start',  onStart)
        .on('indexed', onIndexed)
        .on('info', onInfo)
        .on('skipped', onSkipped)
        .on('done',  onDone)
        .index(grunt.config('site.contentitems'));
}

function flipAliases(grunt, config, site, done) {
    grunt.log.writeln('Swap search index aliases ');

    var es = require('elasticsearch');
    var esClient = new es.Client(config.elasticsearch);
    var configuratorClass = require('../publish/indexer/index-configurator');
    var listener = {
            info : function (msg) {
                grunt.log.writeln(msg);
            }
        };
    var indexConfigurator = new configuratorClass(config, site, listener, esClient);

    indexConfigurator.swapAliasTargets(function (err) {
        esClient.close();
        if (err) {
            grunt.log.error(grunt.log.writeln('Flip aliases ', err['red']));
            done(false);
        } else {
            done(true);
        }
    });
}
