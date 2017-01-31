'use strict';

/**
 * Combines LCOV coverage data for Grunt tasks and client-side JavaScript into a single LCOV file.
 *
 * The JavaScript plugin for SonarQube only allows a single LCOV file to be specified,
 * so coverage files must be merged for accurate coverage data.
 *
 * The grunt-lcov-merge package claims to be able to merge LCOV files but it didn't terminate.
 */
module.exports = function(grunt) {

    var fs = require('fs'),
        process = require('child_process');

    var executable = '/usr/bin/lcov';

    function lcov(callback) {
        process.execFile(executable, [
                '-o', 'test/coverage/lcov.info',
                '-a', 'test/coverage/backend/lcov.info',
                '-a', 'test/coverage/phantomjs/lcov.info'],
            {},
            function (cb) {
                if (cb) {
                    console.error(cb);
                }
                callback(!cb);
            });
    }

    function merge(callback) {
        fs.exists(executable, function(exists) {
            if (exists) {
                lcov(callback);
            } else {
                console.warn('LCOV not found');
                callback();
            }
        });
    }

    grunt.registerTask('merge-lcov', function() {
        merge(this.async());
    });

};
