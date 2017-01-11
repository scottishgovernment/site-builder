'use strict';

// Grunt task that switches the livecontent / offlinecontent aliases.  Called oncea new site has been copied
// to nginx.
var es = require('elasticsearch');

module.exports = function(grunt) {

    grunt.registerTask('swap-search-index-aliases', 'index content from site.contentitems',
        function() {

            grunt.log.writeln('Swap search index aliases ');

            var config = require('config-weaver').config(),
                site = require('../common/site')(),
                esClient = new es.Client(config.elasticsearch),
                configuratorClass = require('../publish/indexer/index-configurator'),
                listener = {
                    info : function (msg) {
                        grunt.log.writeln('Swap search index aliases ', msg['cyan']);
                    }
                },
                indexConfigurator =  new configuratorClass(config, site, listener, esClient),
                done = this.async();

            indexConfigurator.swapAliasTargets(function (err) {
                esClient.close();
                if (err) {
                    grunt.log.error(grunt.log.writeln('Swap search index aliases ', err['red']));
                    done(false);
                } else {
                    grunt.log.writeln('Swap search index aliases ', 'done'['cyan']);
                    done(true);
                }
            });
        }
    );
};
