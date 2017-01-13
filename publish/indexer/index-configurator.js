'use strict';

/**
 * Contains logic configuring blue / green indexes and associated aliases.
 **/
var restler = require('restler');
var async = require('async');

class IndexConfigurator {

    constructor(config, site, listener, esClient) {
        this.mapping = site.getElasticSearchMapping();
        this.listener = listener;
        this.esClient = esClient;
    }

    ensureIndicesAndAliasesExist(callback) {
        this.listener.info('ES mapping available, configuring indices and aliases');

        var esClient = this.esClient;
        var mapping = this.mapping;
        var listener = this.listener;

        async.series([
            function (cb) { ensureIndicesExist(listener, esClient, mapping, cb); },
            function (cb) { ensureAliasesExist(listener, esClient, cb); }
        ], callback);
    }

    swapAliasTargets(callback) {
        var esClient = this.esClient;
        var listener = this.listener;


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
                swapAliases(esClient, listener, callback);
            }
        );
    }
}

function swapAliases(esClient, listener, callback) {
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

        // log the new state of the aliases...
        var summary = actions
            .filter(function (action) { return action.add; })
            .map(function (action) {
                return action.add.alias + ' --> ' + action.add.index;
            }).join(', ');
        listener.info('Aliases: ' + summary['cyan']);

        esClient.indices.updateAliases({ body: { actions: actions}}, callback);
    });
}

function aliasAction(action, index, alias) {
    var actionObj = {};
    actionObj[action] = { index: index, alias: alias };
    return actionObj;
}

function ensureIndicesExist(listener, esClient, mapping, callback) {
    var indices = ['bluecontent', 'greencontent'];
    async.eachSeries(indices,
        function (index, cb) {
            ensureIndexExists(listener, esClient, mapping, index, cb);
        }, callback);
}

function ensureIndexExists(listener, esClient, mapping, index, callback) {
    listener.info('ensureIndexExists esClient.indices.exists: ' + index);
    esClient.indices.exists({ index : index })
        .then(
            function (body) {
                listener.info('esClient.indices.exists '+JSON.stringify(body, null, '\t'));
                if (body === true) {
                    callback(null);
                    return;
                }

                // the index does not exist: create it with the mapping
                listener.info('Creating index ' + index);
                esClient.indices.create({ index: index, body: mapping})
                    .then(
                        function () { callback(null); },
                        function (error) {
                            listener.info('Error creating index ' + JSON.stringify(error, null, '\t'));
                            callback(error);
                        }
                    );
            },
            callback);
}

function ensureAliasesExist(listener, esClient, callback) {
    var aliasNames = ['livecontent', 'offlinecontent'];
    var defaultIndexes = {
        livecontent : 'bluecontent',
        offlinecontent: 'greencontent'
    };
    async.eachSeries(aliasNames,
        function (aliasName, cb) {
            ensureAliasExists(listener, esClient, aliasName, defaultIndexes[aliasName], cb);
        }, callback);
}

function ensureAliasExists(listener, esClient, alias, defaultIndex, callback) {
    listener.info('ensureAliasExists esClient.indices.existsAlias: ' + alias);
    esClient.indices.existsAlias({name: alias})
        .then(
            function (body) {
                if (body === true) {
                    callback(null);
                    return;
                }

                listener.info('Creating alias ' + alias + ' (' + defaultIndex + ')');
                esClient.indices.putAlias({index: defaultIndex, name: alias})
                    .then(
                        function () { callback(null); },
                        function (error) {
                            listener.info('Error creating alias ' + error);
                            callback(error);
                        }
                    );
            },
            callback);
}

module.exports = IndexConfigurator;
