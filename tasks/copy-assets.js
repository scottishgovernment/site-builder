'use strict';

module.exports = function(grunt) {

    var fs = require('fs');
    var assetCount = 0;
    var skipped = {};

    //  create the asset copier
    function assetCopier() {
        var site = require('../common/site')();
        var router = site.router();
        return require('../publish/asset-copier.js').create(router);
    }

    function loadIndex() {

        var index = JSON.parse(fs.readFileSync('out/assets.json'));
        var assetUrls = [];
        for (var assetUrl in index) {
           if (index.hasOwnProperty(assetUrl)) {
               assetUrls.push(assetUrl);
           }
        }
        return assetUrls;
    }

    function onStart(index, targetDir) {
        grunt.log.writeln('Copying assets to ', targetDir['cyan']);
    }

    function onCopied(from, downstream, to) {
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
        var copier = assetCopier();

        copier
            .on('start',  onStart)
            .on('copied', onCopied)
            .on('skipped', onSkipped)
            .on('done',  function (err) { onDone(done, err); })
            .copy(loadIndex(), 'out/assets');
    });

};
