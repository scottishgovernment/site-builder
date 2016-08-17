'use strict';
// The amphora section contains site specific details just to handle aps publications
// It is currently a tactical solution to handle preview for aps publications a
// publication might consist of many resources need to be proxied including thumbnails
// The proxy will be moved to nginx soon or a better way to handle resources will be investigated
// (without being downloaded by preview server before serving)
module.exports = exports = function(config) {
    var amphoraStorageProxy;
    var amphoraResourceProxy;
    
    if (config.amphora) {
        var proxy = require('express-http-proxy');
        amphoraStorageProxy = proxy(config.amphora.host, {
            forwardPath: function (req) {
                return '/amphora/storage' + require('url').parse(req.baseUrl).path;
            }
        });
        amphoraResourceProxy = proxy(config.amphora.host, {
            forwardPath: function (req) {
                return '/amphora' + require('url').parse(req.baseUrl).path;
            }
        });
    }

    return {
        use: function(app) {
            if (config.amphora) {
                app.use('/resource/publications/*', amphoraResourceProxy);
                app.use('/publications/**/documents/*.*', amphoraStorageProxy);
                app.use('/publications/**/images/*.*', amphoraStorageProxy);
            }
        }
    };
};
