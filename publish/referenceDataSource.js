/**
 * CReference data source - fetches and saves reference data (Lookup lists from publishing)
 **/
module.exports = function (config, path) {

    var restler = require('restler');
    var async = require('async');
    var fs = require('fs');

    function fetchList(memo, item, callback) {
        restler.get(item.links[0].href, { headers: { Accept: "application/hal+json"}})
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
                            var data = listData._embedded[item.name];
                            data.forEach( function (dataItem) {
                                delete dataItem._links;
                            });
                            memo[item.name] = data;
                            callback(null, memo);
                        } catch (error) {
                            callback(error);
                        }
                    }
                });
   }

    return {

        writeReferenceData : function (callback) {

            var url = config.publishing.endpoint + 'lists';
            restler.get(url)
                .on('complete', function(data, response) {
                
                    if (data instanceof Error || response.statusCode !== 200) {
                        callback(data);
                    } else {
                        
                        try {
                            var lists = JSON.parse(data);
                            async.reduce(lists.lists, {}, fetchList, 
                                function (err, result) {
                                    fs.writeFile(path, JSON.stringify(result, null, '\t'), callback);
                                });
                        } catch (error) {
                            
                            callback(error);
                        }
                    }
                });
        }
    };
};
