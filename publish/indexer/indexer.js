'use strict';

/**
 * Used to index the contents of a directory.
 */
var async = require('async');
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var es = require('elasticsearch');

var fileOptions = {encoding: 'utf-8'};

function Indexer(filter, formatter, config, site) {

    // filter is used to decide what content items shoulc be indexed
    this.filter = filter;

    // formatter used to format all content items befor eindexing
    this.formatter = formatter;

    this.restler = require('restler');

    this.esClient = new es.Client(config.elasticsearch);

    var configuratorClass = require('./index-configurator');
    var that = this;
    var configuratorListener = {
        info : function (msg) { that.fire('info', msg); }
    };
    this.indexConfigurator =  new configuratorClass(config, site, configuratorListener, this.esClient);

    // default do nothing callbacks. Override by using 'on'
    this.callbacks = {
        // Called when the index is about to start: srcdir, searchurl
        start : [],

        // called to provide information
        info: [],

        // called when an asset has been indexed: uuid
        indexed : [],

        // calleed if a content was skipped: uuid
        skipped: [],

        // called when the copy is finished: errs, srcdir, searchUrl
        done: []
    };
}

Indexer.prototype.index = function(srcdir) {
    var that = this;

    that.fire('start', srcdir);

    var globSpec = path.join(srcdir, '**/*.json');
    glob(globSpec, {}, function (err, files) {
        async.series(
            [
                function (cb) {
                    that.indexConfigurator.ensureIndicesAndAliasesExist(cb);
                },

                function (cb) {
                    indexFiles(that, files, srcdir, cb);
                }
            ],
            function(errs) {
                that.esClient.close();
                that.fire('done', errs, srcdir);
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

// load and index an array of filenames.
function indexFiles(indexer, files, srcdir, callback) {
    var partitions = partitionArray(files, 100);
    async.eachSeries(partitions,
        function (partition, cb) {
            indexPartition(partition, indexer, srcdir, cb);
        }, callback);
}

// partition an array into chunks
function partitionArray(filesArray, size) {
    var partitions = [];
    var currentPartition = [];

    for (var i = 0; i < filesArray.length; i++) {
        currentPartition.push(filesArray[i]);

        if (currentPartition.length === size || i === filesArray.length - 1) {
            partitions.push(currentPartition);
            currentPartition = [];
        }
    }
    return partitions;
}

// filter, format and then index a partition of content items
function indexPartition(partition, indexer, srcdir, callback) {

console.log('indexPartition ', partition.length);

    async.map(partition, loadFile, function (loadErr, data) {

        if (loadErr) {
            callback(loadErr);
            return;
        }

        // filter out content items that should not be indexed
        data = data.filter(function (item) {
            return indexer.filter.accept(item);
        });

console.log('data length ', data.length);

        // format each item that hasnt been fitlered out
        async.mapSeries(data,
            function (item, cb) {
                indexer.formatter.format(item, srcdir, function (formattedItem) {
                    cb(null, formattedItem);
                });
            },

            function (formattingErr, mappedData) {

                if (mappedData.length > 0) {
                    indexItems(mappedData, indexer, callback);
                } else {
                    callback();
                }

            }
        );
    });
}

// index an array of formatted content items using a bulk request
function indexItems(items, indexer, callback) {
    var body = [];

console.log('indexItems ', items.length);
    items.forEach(
        function (item) {
            var type = item._embedded.format.name.toLowerCase();
            var id = item._id;
            body.push({
                index: {
                    _index: 'offlinecontent',
                    _type: type,
                    _id: id
                }
            });
            body.push(item);
        });

indexer.fire('info', 'indexer.esClient.bulk ' + body.length);

    indexer.esClient.bulk({ body: body },
        function (err, resp) {

            if (err) {
                callback(err);
                return;
            }

            // determine if we failed to index any items
            var errorItems = resp.items.filter(function (item) {
                return item.index.status >= 400;
            });

            if (errorItems.length > 0) {
                callback({ msg: 'Failed to index some items', errors: errorItems});
                return;
            }

            resp.items.forEach(function (item) {
                indexer.fire('indexed', item.index._id);
            });
            callback(err);
        });
}

function loadFile(file, callback) {
    fs.readFile(file, fileOptions, function (err, data) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, JSON.parse(data));
        }
    });
}

function create(config, site) {
    var filter = require('./filter');
    var formatter = require('./formatter');
    return new Indexer(filter, formatter, config, site);
}

module.exports = {
    create: create
};
