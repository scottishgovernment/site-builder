'use strict';

var config = require('config-weaver').config();
var restler = require('restler');
var args = require('optimist').argv;
var fs = require('fs-extra');
var path = require('path');


// Grunt task that fetches content from the content repo and constructs the site
//
// It does this by calling a ContentSource with ContentHandlers set up to handle each item in turn.
// These handlers create the yaml, index the content and create the search page
var loadModule = function(name) {
    return require(path.join('../publish', name));
};

var getHandlers = function(app, grunt) {

    var tempDir = grunt.config('site.temp');
    var nginx = grunt.config('site.nginx');

    var handlers = [
        // handler to index content
        loadModule('logger-handler')(app, grunt),

        // handler to create redirects
        loadModule('redirect-writing-content-handler')(app, nginx),

        // handler to write yaml files to disk
        loadModule('save-item')(app, tempDir, fs)
    ];
    return handlers;
};

module.exports = function(grunt) {

    grunt.registerTask('create-yaml', 'generate content in the resources dir',
        function() {

            var site = require('../common/site')();
            var app = require('../publishing/app')(config, site, false);
            
            //If we have an IDs, then put them in an array for later
            if (args.ids) {
                app.context.ids = String(args.ids).split(',') || undefined;
            }
            var release = this.async();
            // create a composite content handler to marshal the tasks that need to happen
            var contentHandler = loadModule('composite-content-handler')(
                getHandlers(app, grunt));
            var items = loadModule('items')(app, contentHandler);
            items.generate(function(err) {

                if (err || app.context.errors.length > 0) {
                    console.log('Errors: ');
                    console.log(err || '');
                    console.log(app.context.errors);
                }
                release(true);
            });
        }
    );
};
