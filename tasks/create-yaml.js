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

var getHandlers = function(tempDir, app, grunt) {
    return [
        // handler to index content
        loadModule('logger-handler')(app, grunt),

        // handler to write yaml files to disk
        loadModule('save-item')(app, tempDir, fs)
    ];
};

module.exports = function(grunt) {

    grunt.registerTask('create-yaml', 'generate content in the resources dir',
        function() {
            var tempDir = config.tempdir;
            var site = require('../common/site')();
            var app = require('../publishing/app')(config, site, false);

            //If we have any IDs, then put them in an array for later
            if (args.ids) {
                app.context.ids = String(args.ids).split(',') || undefined;
            }
            var release = this.async();

            // create a composite content handler to marshal the tasks that need to happen
            var contentHandler
                = loadModule('composite-content-handler')(
                    getHandlers(tempDir, app, grunt));
            var items = loadModule('items')(tempDir, app, contentHandler);

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
