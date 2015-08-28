'use strict';

module.exports = function(grunt) {

    var config = require('config-weaver').config();
    var path = require('path'),
        cp = require('child_process');

    function siteTarget() {
        return config.publish ? config.publish.site : undefined;
    }

    function redirectsTarget() {
        return config.publish ? config.publish.redirects : undefined;
    }

    function publish(script, target, callback) {
        var bin = path.join(__dirname, '../scripts', script);
        var proc = cp.spawn(bin, [target], {stdio: 'inherit'});
        proc.on('close', function (code) {
            callback(code);
        });
    }

    function runPublishScript(script, target, callback) {
        if (!target) {
            console.log("No copy target configured.");
            callback(true);
        } else {
            publish(script, target, callback);
        }
    }

    grunt.registerTask('copy-site', 'Publish site', function() {
        var release = this.async();
        var target = siteTarget();
        runPublishScript('copy-site', target, release);
    });

    grunt.registerTask('copy-redirects', 'Publish redirects', function() {
        var release = this.async();
        var target = redirectsTarget();
        runPublishScript('copy-redirects', target, release);
    });

};
