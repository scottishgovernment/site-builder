'use strict';

/**
 * Contains logic configuring blue / green indexes and associated aliases.
 *
 * See MGS-1821.
 **/
var restler = require('restler');
var async = require('async');

class IndexConfigurator {

    constructor(config, site, esClient) {
        this.searchUrl = config.search.endpoint;

        // MGS-1821: if the site can provide a mapping then use it to configure the
        // indexes / aliases.  Once both sites control their own mappings we can remove
        // this ternary expression and replace with indexer.site.getElasticSearchMapping();
        this.mapping = site.getElasticSearchMapping
            ? site.getElasticSearchMapping() : null;
        this.esClient = esClient;
    }

    ensureIndicesAndAliasesExist(callback) {
        // fallback to old behaviour if no mapping is available.
        // This can be removed on conclusion of MGS-1821
        if  (!this.mapping) {
            restler.postJson(searchUrl + 'siteIndexBegin', {}).on('complete', callback);
            return;
        }

        // we have a mapping, ensure that all required indices exist
        var esClient = this.esClient;
        var mapping = this.mapping;

        async.series([
            function (cb) { ensureIndicesExist(esClient, mapping, cb); },
            function (cb) { ensureAliasesExist(esClient, cb); }
        ], callback);
    }

    swapAliasTargets(callback) {
        if  (!this.mapping) {
            // Once mappings file is available in both sites we can remove this
            restler
                .postJson(searchUrl + 'siteIndexEnd', {})
                .on('complete', callback);
            return;
        }

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

function ensureIndicesExist(esClient, mapping, callback) {
    var indices = ['bluecontent', 'greencontent'];
    async.eachSeries(indices,
        function (index, cb) {
            ensureIndexExists(esClient, mapping, index, cb);
        },
        callback);
}

function ensureIndexExists(esClient, mapping, index, callback) {
    esClient.indices.exists({ index : index })
        .then(
            function (body) {
                if (body === true) {
                    callback(null);
                    return;
                }

                // the index does not exist: create it with the mapping
                esClient.indices.create({ index: index, body: mapping})
                    .then(
                        function () { callback(null); },
                        function (error) { callback(error); }
                    );
            },
            callback);
}

function ensureAliasesExist(esClient, callback) {
    var aliasNames = ['livecontent', 'offlinecontent'];
    var defaultIndexes = {
        livecontent : 'bluecontent',
        offlinecontent: 'greencontent'
    };
    async.eachSeries(aliasNames,
        function (aliasName, cb) {
            ensureAliasExists(esClient, aliasName, defaultIndexes[aliasName], cb);
        },
        callback);
}

function ensureAliasExists(esClient, alias, defaultIndex, callback) {
    esClient.indices.existsAlias({name: alias})
        .then(
            function (body) {
                if (body === true) {
                    callback(null);
                    return;
                }

                // create the alias
                esClient.indices.putAlias({index: defaultIndex, name: alias})
                    .then(
                        function () { callback(null); },
                        function (error) { callback(error); }
                    );
            },
            callback);
}

module.exports = IndexConfigurator;
