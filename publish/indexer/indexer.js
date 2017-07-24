'use strict';

/**
 * Used to index the contents of a directory.
 */
var async = require('async');
var fs = require('fs');
var path = require('path');
var es = require('elasticsearch');

function Indexer(config, site) {
    this.restler = require('restler');

    var esConfig = {
        host: config.elasticsearch.host,
        log: 'info'
    };
    this.esClient = new es.Client(esConfig);

    var configuratorClass = require('./index-configurator');
    var that = this;
    var configuratorListener = {
        info : function (msg) { that.fire('info', msg); }
    };
    this.indexConfigurator =  new configuratorClass(site, configuratorListener, this.esClient);

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

    async.series(
      [
          cb => that.indexConfigurator.ensureIndicesAndAliasesExist(cb),
          cb => {
              const chunkCount = 3;
              fs.readdir(srcdir, (err, files) => {
                  var chunks = chunkify(files, chunkCount);
                  async.each(chunks,
                      (chunk, cb) => indexChunk(srcdir, chunk, this, cb),
                      errs => {
                          that.esClient.close();
                          that.fire('done', errs, srcdir);
                      }
                  );
              });
          }
      ],

      errs => {
          that.esClient.close();
          that.fire('done', errs, srcdir);
      }
  );
};

function indexChunk(srcdir, chunk, indexer, callback) {
    // when the currentl request is larger than partitionSize, send the request.
    // note: this means that the request may be larger than this.
    const partitionSize = 1048576 * 5; // mbs
    var bulkRequest = [];
    var pos = 0;
    var i = 0;
    async.eachLimit(chunk, 1,

        (filename, cb) => fs.readFile(path.join(srcdir, filename), 'utf8',
            (err, item) => {
                if (err) {
                    cb(err, null);
                    return;
                }

                var command = indexCommand(bulkRequest, filename);
                pos += command.length + item.length + 2;
                bulkRequest.push(command);
                bulkRequest.push(item);

                i++;
                if (pos > partitionSize || i === chunk.length) {
                    indexBulkRequest(indexer, bulkRequest, indexErr => {
                        pos = 0;
                        bulkRequest = [];
                        cb(indexErr);
                    });
                    return;
                }
                cb();
            }
        ),
        callback);
}

function indexCommand(request, filename) {
    var parts = filename.split('.');
    var id = parts[0];
    var type = parts[1];
    return JSON.stringify({
        index: {
            _index: 'offlinecontent',
            _type: type,
            _id: id
        }
    });
}

function indexBulkRequest(indexer, bulkRequest, callback) {
    indexer.esClient.bulk({ body: bulkRequest},
        (err, resp) => {
            if (err) {
                console.log('err', err);
                callback(err);
                return;
            }

            // determine if we failed to index any items
            var errorItems = resp.items.filter(item => item.index.status >= 400);

            if (errorItems.length > 0) {
                callback({ msg: 'Failed to index some items', errors: errorItems});
                return;
            }

            indexer.fire('indexed', resp.items);
            callback(err);
        });
}

function chunkify(array, parts) {
    if (parts< array.length && array.length > 1 && array != null) {
        var newArray = [];
        var counter1 = 0;
        var counter2 = 0;

        while (counter1 < parts) {
            newArray.push([]);
            counter1 += 1;
        }

        for (var i = 0; i < array.length; i++) {
            newArray[counter2++].push(array[i]);
            if (counter2 > (parts - 1)) {
                counter2 = 0;
            }
        }

        return newArray;
    } else {
        return array;
    }
}

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
    this.callbacks[event].forEach(cb => cb.apply(cb, args));
};

function create(config, site) {
    return new Indexer(config, site);
}

module.exports = {
    create: create
};
