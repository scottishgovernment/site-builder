'use strict';

/**
 * Contains logic configuring blue / green indexes and associated aliases.
 *
 * See MGS-1821.
 **/
var restler = require('restler');
var async = require('async');

class IndexConfigurator {

    constructor(config, site, indexer, esClient) {
        this.mapping = site.getElasticSearchMapping();
        this.indexer = indexer;
        this.esClient = esClient;
    }

    ensureIndicesAndAliasesExist(callback) {
        this.indexer.fire('info', 'ES mapping available, configuring indices and aliases');

        var esClient = this.esClient;
        var mapping = this.mapping;
        var indexer = this.indexer;

        async.series([
            function (cb) { ensureIndicesExist(indexer, esClient, mapping, cb); },
            function (cb) { ensureAliasesExist(indexer, esClient, cb); }
        ], callback);
    }

    swapAliasTargets(callback) {
        // how many doc in the offline index...
        var esClient = this.esClient;

        esClient.count({ index : 'offlinecontent'},
            function (error, response) {
                if (error) {
                    callback(error);
                    return;
                }
                if (response < 10) {
                    callback('Offline index is too small ' + response);
                    return;
                }
                swapAliases(esClient, callback);
            }
        );
    }
}

function swapAliases(esClient, callback) {

    esClient.cat.aliases({ format: 'json'}, function (err, aliases) {
        if (err) {
            callback(err);
            return;
        }
        var actions = [];

        // remove both existing aliases
        aliases.forEach(function (alias) {
            actions.push(aliasAction('remove', alias.index, alias.alias));
        });

        // add the new swapped indexes
        aliases.forEach(function (alias) {
            var newIndex = alias.index === 'greencontent' ? 'bluecontent' : 'greencontent';
            actions.push(aliasAction('add', newIndex, alias.alias));
        });

        esClient.indices.updateAliases({ body: { actions: actions}}, callback);
    });
}

function aliasAction(action, index, alias) {
    var actionObj = {};
    actionObj[action] = { index: index, alias: alias };
    return actionObj;
}

function ensureIndicesExist(indexer, esClient, mapping, callback) {
    var indices = ['bluecontent', 'greencontent'];
    async.eachSeries(indices,
        function (index, cb) {
            ensureIndexExists(indexer, esClient, mapping, index, cb);
        }, callback);
}

function ensureIndexExists(indexer, esClient, mapping, index, callback) {
    esClient.indices.exists({ index : index })
        .then(
            function (body) {
                if (body === true) {
                    callback(null);
                    return;
                }

                // the index does not exist: create it with the mapping
                indexer.fire('info', 'Creating index ' + index);
                esClient.indices.create({ index: index, body: mapping})
                    .then(
                        function () { callback(null); },
                        function (error) {
                            indexer.fire('info', 'Error creating index ' + JSON.stringify(error, null, '\t'));
                            callback(error);
                        }
                    );
            },
            callback);
}

function ensureAliasesExist(indexer, esClient, callback) {
    var aliasNames = ['livecontent', 'offlinecontent'];
    var defaultIndexes = {
        livecontent : 'bluecontent',
        offlinecontent: 'greencontent'
    };
    async.eachSeries(aliasNames,
        function (aliasName, cb) {
            ensureAliasExists(indexer, esClient, aliasName, defaultIndexes[aliasName], cb);
        }, callback);
}

function ensureAliasExists(indexer, esClient, alias, defaultIndex, callback) {
    esClient.indices.existsAlias({name: alias})
        .then(
            function (body) {
                if (body === true) {
                    callback(null);
                    return;
                }

                // create the alias
                indexer.fire('info', 'Creating alias ' + alias + ' (' + defaultIndex + ')');
                esClient.indices.putAlias({index: defaultIndex, name: alias})
                    .then(
                        function () { callback(null); },
                        function (error) {
                            indexer.fire('info', 'Error creating alias ' + error);
                            callback(error);
                        }
                    );
            },
            callback);
}

module.exports = IndexConfigurator;
