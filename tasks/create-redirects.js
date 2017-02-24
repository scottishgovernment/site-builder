'use strict';
// Grunt task that fetches content item urls from the redirects endpoint 
// and using the data calls publish/redirects that generates urlAliasses.txt
module.exports = function(grunt) {
    var config = require('config-weaver').config();
    var name = 'create-redirects';
    var description = 'generate urlAliases.txt file for the content items';
    grunt.registerTask(name, description, function() {
        var release = this.async();
        var site = require('../common/site')();
        var app = require('../publishing/app')(config, site, false);
        var nginx = grunt.config('site.nginx');
        var redirects = require('../publish/redirects')(app, nginx);
        app.contentSource.fetchRedirects({}, 'siteBuild', function(err, data) {
            redirects.create(data, release);
        });
    });
};
