'use strict';

var fs = require('fs');
var path = require('path');

/**
 * Grunt task used to copy dynamic assets as a part of the site build.
 **/
function assetCopier() {
    var site = require('../common/site')();
    var router = site.router();
    return require('../publish/asset-copier.js').create(router);
}

function loadIndex(assetsFile) {
    var index = JSON.parse(fs.readFileSync(assetsFile));
    var assetUrls = [];
    for (var assetUrl in index) {
       if (index.hasOwnProperty(assetUrl)) {
           assetUrls.push(assetUrl);
       }
    }
    return assetUrls;
}

module.exports = function(grunt) {

    var assetCount = 0;
    var skipped = {};

    function onStart(index, targetDir) {
        grunt.log.writeln('Copying assets to ', targetDir['cyan']);
    }

    function onCopied() {
        assetCount++;
    }

    function onSkipped(url, reason) {
        skipped[url] = reason;
    }

    function onDone(done, err) {
        if (err) {
            grunt.log.error('Failed to copy assets:', err);
            done(false);
        } else {
            grunt.log.writeln('Copied '['green'], assetCount.toString()['cyan'], ' assets.');
            grunt.log.writeln('Skipped '['yellow'], skipped);
            done(true);
        }
    }

    /**
     * Grunt task to copy synamic assests such as images.
     */
    grunt.registerTask('copy-assets', '', function() {
        var done = this.async();
        var config = require('config-weaver').config();
        var assetsDir = path.join(config.tempdir, 'assets');
        var assetsFile = path.join(config.tempdir, 'assets.json');

        assetCopier()
            .on('start',  onStart)
            .on('copied', onCopied)
            .on('skipped', onSkipped)
            .on('done',  function (err) { onDone(done, err); })
            .copy(loadIndex(assetsFile), assetsDir);
    });

};
