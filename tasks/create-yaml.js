'use strict';

var config = require('config-weaver').config();
var restler = require('restler');
var myArgs = require('optimist').argv;
var contentItems;
//If we have an IDs, then put them in an array for later
if (myArgs.ids) {
    contentItems = String(myArgs.ids).split(",") || undefined;
}

// Grunt task that fetches content from the content repo and constructs the site
//
// It does this by calling a ContentSource with ContentHandlers set up to handle each item in turn.
// These handlers create the yaml, index the content and create the search page

module.exports = function(grunt) {


    grunt.registerTask('create-yaml', 'generate content in the resources dir',
        function() {

            var target = grunt.config('site.contentitems'),
                sitemap = grunt.config('site.sitemap'),
                nginx = grunt.config('site.nginx'),
                searchUrl = config.search.endpoint;

            var release = this.async();

            var handlers = [
                // handler to index content
                require('../build/logger-handler')(grunt),

                // handler to create redirects
                require('../build/redirect-writing-content-handler')(nginx),

                // handler to write yaml files to disk
                require('../build/yaml-writing-content-handler')(target),

                // handler to write sitemap.xml files
                require('../build/sitemap-handler')(sitemap),

                // handler to write search results yaml to disk
                require('../build/search-page-creating-content-handler')(target),

                // handler to index content
                require('../build/indexing-content-handler')(searchUrl)
            ];

            // create a composite content handler to marshal the tasks that need to happen
            var contentHandler = require('../build/composite-content-handler')(handlers);

            // create the formatter
            var contentFormatter = require('../item-formatter')();

            // create the contentsource
            var contentSource = require('../build/content-source')(config, contentFormatter, contentHandler);
            contentSource.getContent(
                 function() {
                    release(true);
                 }, contentItems);
        }
    );
};
