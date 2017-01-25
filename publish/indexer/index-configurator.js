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
        async.series([
            cb => ensureIndicesExist(this.listener, this.esClient, this.mapping, cb),
            cb => ensureAliasesExist(this.listener, this.esClient, cb)
        ], callback);
    }

    swapAliasTargets(callback) {
        this.esClient.count({ index : 'offlinecontent'},
            (error, response) => {
                if (error) {
                    callback(error);
                    return;
                }
                if (response < 10) {
                    callback('Offline index is too small ' + response);
                    return;
                }
                swapAliases(this.esClient, this.mapping, this.listener, callback);
            }
        );
    }
}

function swapAliases(esClient, mapping, listener, callback) {
    esClient.cat.aliases({ format: 'json'}, (err, aliases) => {
        if (err) {
            callback(err);
            return;
        }
        var actions = [];

        // remove both existing aliases
        aliases.forEach(alias => actions.push(aliasAction('remove', alias.index, alias.alias)));

        // add the new swapped indexes
        aliases.forEach(alias => {
            var newIndex = alias.index === 'greencontent' ? 'bluecontent' : 'greencontent';
            actions.push(aliasAction('add', newIndex, alias.alias));
        });

        // log the new state of the aliases...
        var aliasToIndex = {};
        actions
            .filter(action => action.add)
            .forEach(action => aliasToIndex[action.add.alias] = action.add.index);
        listener.info('Aliases: ' + JSON.stringify(actions, null, '\t')['cyan']);

        var newofflineindex = aliases.filter(alias => alias.alias === 'livecontent')[0].index;
        esClient.indices.updateAliases({ body: { actions: actions}},
            //delete the offline index, then recreate it with the new mapping ready for next index.
            () =>
                async.series([
                    // delete the offline index then recreate it and its alias
                    cb => esClient.indices.delete({ index: newofflineindex }, cb),
                    cb => esClient.indices.create({ index: newofflineindex, body: mapping}, cb),
                    cb => esClient.indices.putAlias({index: newofflineindex, name: 'offlinecontent'}, cb)
                ], callback)
        );
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
        (index, cb) => ensureIndexExists(listener, esClient, mapping, index, cb),
        callback);
}

function ensureIndexExists(listener, esClient, mapping, index, callback) {
    listener.info('ensureIndexExists esClient.indices.exists: ' + index);
    esClient.indices.exists({ index : index })
        .then(
            function (body) {
                if (body === true) {
                    callback(null);
                    return;
                }

                // the index does not exist: create it with the mapping
                listener.info('Creating index ' + index);
                esClient.indices.create({ index: index, body: mapping})
                    .then(
                        () => callback(null),
                        (error) => {
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
        (aliasName, cb) => ensureAliasExists(listener, esClient, aliasName, defaultIndexes[aliasName], cb),
        callback);
}

function ensureAliasExists(listener, esClient, alias, defaultIndex, callback) {
    listener.info('ensureAliasExists esClient.indices.existsAlias: ' + alias);
    esClient.indices.existsAlias({name: alias})
        .then(
            body => {
                if (body === true) {
                    callback(null);
                    return;
                }

                listener.info('Creating alias ' + alias + ' (' + defaultIndex + ')');
                esClient.indices.putAlias({index: defaultIndex, name: alias})
                    .then(
                        () => callback(null),
                        error => {
                            listener.info('Error creating alias ' + error);
                            callback(error);
                        }
                    );
            },
            callback);
}

module.exports = IndexConfigurator;
