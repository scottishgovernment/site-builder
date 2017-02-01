'use strict';

/**
 * Content source used by the side build and preview.
 *
 * Acts as a client to the build api.
 **/
module.exports = function(config, restler) {

    // What are these replaces for?
    var publishing = config.publishing.endpoint;
    var buildapi = config.buildapi.endpoint;

    var paths = require('path');
    var fs = require('fs-extra');

    var call = function(url, headers, callback) {
        var options = headers ? { headers: headers } : {};
        restler
            .get(url, options)
            .on('complete', callback);
    };

    var onFail = function(url, error, res, callback) {
        error = error ? { error: error } : {};
        error.statusCode = res ? res.statusCode : 0;
        error.request = url;
        callback(error);
    };

    var getResource = function(url, headers, callback) {
        call(url, headers, function(data, res) {
            if (data instanceof Error || res.statusCode !== 200) {
                onFail(url, data, res, callback);
            } else {
                callback(null, data instanceof Object ? data : JSON.parse(data));
            }
        });
    };

    var buildApi = function(pathInfo, path, visibility) {
        path = path + '?visibility=' + visibility;
        return buildapi + paths.join(pathInfo, path);
    };

    // this function will be removed once resolve content item is removed
    var getResourceSync = function(urlOrId, headers, visibility) {
        var url = buildApi('urlOrId', urlOrId, visibility);
        console.log('[additional-resources] ' + url);
        var res = require('sync-request')('GET', url, {headers:headers});
        var content = JSON.parse(res.getBody('utf8'));
        content.body = content.contentItem.content;
        return content;
    };

    return {

        resource: getResource,

        /**
         * Fetch the urls for an array of id's
         **/
        fetchUrlsById: function(ids, headers, callback) {

            // if there are no ids then just return an empty object
            if (ids && ids.length === 0) {
                callback(null, {});
                return;
            }

            // request
            var url = publishing + 'items/urlsById';
            if (ids) {
                var idsParam = ids.join(',');
                url = url + '?ids=' + idsParam;
            }

            getResource(url, headers, callback);
        },

        fetchItem: function(urlOrId, headers, visibility, callback) {
            var url = buildApi('urlOrId', urlOrId, visibility);
            getResource(url, headers, callback);
        },

        /**
         * Temporary method until dependency loader is put back in
         * This function is temporary function and going to be removed completely.
         * it has policy specific details
         */
        fetchItemSync: function(urlOrId, headers, visibility) {
            var cacheId = 'out/.preview/' + Buffer.from(urlOrId).toString('hex');
            fs.ensureDirSync('out/.preview');
            if (fs.existsSync(cacheId)) {
                return JSON.parse(fs.readFileSync(cacheId));
            } else {
                var content = getResourceSync(urlOrId, headers, visibility);
                fs.writeFileSync(cacheId, JSON.stringify(content));
                return content;
            }
        },

        fetchItems: function(headers, visibility, callback) {
            var url = buildApi('items', '', visibility);
            getResource(url, headers, callback);
        }
    };
};

