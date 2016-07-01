/**
 * CReference data source - fetches and saves reference data (Lookup lists from publishing)
 **/
module.exports = function (config, path) {

    var restler = require('restler');
    var async = require('async');
    var fs = process.previewCache || require('fs');
    var authtoken;

    function fetchList(memo, item, callback) {
        var headers = {
          'Accept': 'application/hal+json',
          'Authorization': 'Bearer ' + authtoken
        };
        restler.get(item.links[0].href, { headers: headers })
                .on('complete', function(data, response) {
                    if (data instanceof Error || response.statusCode !== 200) {
                        callback(data);
                    } else {
                        var skip = ['usermanagedformats', 'predicate_groups'];

                        if (skip.indexOf(item.name) !== -1) {
                            callback(null, memo);
                            return;
                        }

                        try {
                            var listData = JSON.parse(data);
                            var list = listData._embedded[item.name];
                            list.forEach(function (dataItem) {
                                delete dataItem._links;
                            });
                            memo[item.name] = list;
                            callback(null, memo);
                        } catch (error) {
                            callback(error);
                        }
                    }
                });
    }

    function headers(authtoken) {
        return {
            headers: {
                'Authorization': 'Bearer ' + authtoken
            }
        };
    }

    function login(callback) {
        restler.postJson(config.authentication.endpoint,
            {
                'userName': config.authentication.user,
                'plainPassword': config.authentication.password
            })
        .on('complete', function(data) {
            if (data instanceof Error) {
                throw data;
            } else {
                authtoken = JSON.parse(data).sessionId;
                callback(null, authtoken);
            }
        });
    }

    function fetchReferenceData(callback) {
        var url = config.publishing.endpoint + 'lists';
        restler.get(url, headers(authtoken))
                .on('complete', function(data, response) {
                    if (data instanceof Error || response.statusCode !== 200) {
                        callback(data);
                    } else {
                        try {
                            var lists = JSON.parse(data);
                            async.reduce(lists.lists, {}, fetchList,
                                function (err, result) {
                                    var json = JSON.stringify(result, null, '\t');
                                    fs.writeFile(path, json, callback);
                                });
                        } catch (error) {
                            callback(error);
                        }
                    }
                });
    }

    return {

        writeReferenceData : function (callback) {
            login(
                function() {
                    fetchReferenceData(callback);
                });
        }
    };
};
