'use strict';

/**
 * Used to index the contents of a directory.
 */
var async = require('async');
var fs = require('fs');
var path = require('path');
var glob = require('glob');

var fileOptions = {encoding: 'utf-8'};

function Indexer(filter, formatter) {

    // filter is used to decide what content items shoulc be indexed
    this.filter = filter;

    // formatter used to format all content items befor eindexing
    this.formatter = formatter;

    this.restler = require('restler');

    // default do nothing callbacks. Override by using 'on'
    this.callbacks = {
        // Called when the index is about to start: srcdir, searchurl
        start : [],

        // called when an asset has been indexed: uuid
        indexed : [],

        // calleed if a content was skipped: uuid
        skipped: [],

        // called when the copy is finished: err
        done: []
    };
}

Indexer.prototype.index = function(srcdir, searchUrl) {
    var that = this;

    that.fire('start', srcdir, searchUrl);

    var globSpec = path.join(srcdir, '**/*.json');
    glob(globSpec, {}, function (err, files) {
        async.series(
            [
                function (cb) { siteIndexBegin(that, searchUrl, cb); },
                function (cb) { indexFiles(that, files, srcdir, searchUrl, cb); },
                function (cb) { siteIndexEnd(that, searchUrl, cb); }
            ],
            function() {
                that.fire('done', srcdir, searchUrl);
            }
        );
    });
};

// register a listener for a given event
Indexer.prototype.on = function(event, callback) {
    this.callbacks[event].push(callback);
    return this;
};

// fire an event
Indexer.prototype.fire = function (event) {
    var args = Array.prototype.slice.call(arguments);
    // get rid of the 'event' argument, the callback dont need it
    args.shift();
    this.callbacks[event].forEach(function (cb) {
        cb.apply(cb, args);
    });
};

function indexFiles(indexer, files, srcdir, searchUrl, callback) {
    async.eachLimit(files, 50,
        function (file, cb) {
            indexFile(file, srcdir, searchUrl, indexer, cb);
        },
        callback);
}

function indexFile(file, srcdir, searchUrl, indexer, callback) {
    // parse the file
    fs.readFile(file, fileOptions, function (err, data) {

        // load the item
        var item = JSON.parse(data);

        // decide wether to index it or not
        if (!indexer.filter.accept(item)) {
            indexer.fire('skipped', item.uuid);
            callback();
            return;
        }

        // format it before indexing
        indexer.formatter.format(item, srcdir, function (formattedItem) {
            indexer.restler.putJson(searchUrl, formattedItem)
                .on('complete', function() {
                     indexer.fire('indexed', formattedItem.url);
                     callback();
                });
        });
    });
};

function siteIndexBegin(indexer, searchUrl, callback) {
    indexer.restler
      .postJson(searchUrl + 'siteIndexBegin', {})
      .on('complete', function () { callback(); });
}

function siteIndexEnd(indexer, searchUrl, callback) {
    indexer.restler
        .postJson(searchUrl + 'siteIndexEnd', {})
        .on('complete', function () { callback(); });
}

function create() {
    var filter = require('./filter');
    var formatter = require('./formatter');
    return new Indexer(filter, formatter);
}

module.exports = {
    create: create
};
