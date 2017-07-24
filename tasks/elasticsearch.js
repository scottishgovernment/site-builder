'use strict';

/**
 * Grunt task for indexing content with eleasticsearch.  There are two targets:
 *   register-templates:
 *      this target registers search templates from a directory that the site
 *      object providers.
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
            case 'register-templates' :
                registerTemplates(grunt, config, site, done);
            break;

            case 'index-content':
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

function registerTemplates(grunt, config, site, done) {
    var es = require('elasticsearch');
    var esClient = new es.Client(config.elasticsearch);
    var configuratorClass = require('../publish/indexer/template-configurator');
    var listener = {
            info : function (msg) {
                grunt.log.writeln(msg);
            }
        };
    var templateConfigurator = new configuratorClass(site, listener, esClient);

    templateConfigurator.registerTemplates(err => {
        esClient.close();
        if (err) {
            grunt.log.error(grunt.log.writeln('Register templates ', JSON.stringify(err, null, '\t')['red']));
            done(false);
        } else {
            done(true);
        }
    });
}

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
    var path = require('path');
    var indexDir = path.join(config.tempdir, 'indexable');
    indexer
        .on('start',  onStart)
        .on('indexed', onIndexed)
        .on('info', onInfo)
        .on('skipped', onSkipped)
        .on('done',  onDone)
        .index(indexDir);
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
    var indexConfigurator = new configuratorClass(site, listener, esClient);

    indexConfigurator.swapAliasTargets(err => {
        esClient.close();
        if (err) {
            grunt.log.error(grunt.log.writeln('Flip aliases ', err['red']));
            done(false);
        } else {
            done(true);
        }
    });
}
