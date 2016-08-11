/**
 * Amphora Source - amphora items.
    login logout per publication (site-build only, preview uses current security context)
    there used to be top level login and logout at the end of build process
    that is gone and each mnodule (i.e referenceData, decommissioner)
    manages its own authenentication and leaves session record,(logout is no longer called)
    amphora calls login logout per publication to delete session record
    Rather prefer login is done only once per site build and logout is called at the end of the
    create yaml process however that has been removed
 **/
module.exports = function (config) {
    process.mode  = process.mode || 'site';
    var restler = require('restler');
    var async = require('async');
    var formatter = require('./publication-formatter')();
    var authentication = require('./authentication')(config, restler);
    var ph = require('./publication-handler')();
    var rh = require('./resource-handler')();
    var pch = require('./page-content-handler')();
    var dh = require('./download-handler')();
    var publicationUrlReg = /publications\/(.*)?\/pages\/(.*)?\/$/;
     // fetch the resource from amphora with this location
    function fetchResource(amphora, location, auth, callback) {
        location = config.amphora.endpoint + 'assemble/' + location;
        restler.get(location, auth).on('complete', function(resource, response) {
            if (resource instanceof Error || response.statusCode !== 200) {
                callback(resource);
            } else {
                handleResource (amphora, resource, callback);
            }
        });
    }

    function handleResource(amphora, resource, callback) {
        async.series([
            function (cb) {
               ph.handle(amphora, resource, cb);
            }, function (cb) {
               rh.handle(amphora, resource, cb);
            }, function (cb) {
               dh.handle(amphora, resource, cb);
            },  function (cb) {
               pch.handle(amphora, resource, cb);
            }
        ], function (err, results) {
           async.each(resource.resources, function(child, sub) {
                handleResource(amphora, child, sub);
            }, callback);
        });
    }

    function withAuth(auth, callback) {
        if (process.mode === 'site') {
            authentication.login(function(err, token) {
                auth = {headers: {'Authorization' : 'Bearer ' + token}};
                auth.done = function(cb) {
                    authentication.logout(token, cb);
                }; callback(auth);
            });
        } else {
            auth.done = function(cb) {
                cb();
            }; callback(auth);
        }
    }

    return {

        getPageNumber : function(source) {
            var aps = (source + '/').replace(/\/\//g, '/').match(publicationUrlReg);
            return aps ? aps[2]: null;
        },

        getUrl : function(source) {
            var aps = source.replace(/\/\//g, '/').match(publicationUrlReg);
            return aps ? '/publications/' + aps[1] + '/' : source;
        },

        handleAmphoraContent : function (item, auth, callback, currentPage) {
            if (item.contentItem._embedded.format['name'] !== 'APS_PUBLICATION') {
                callback(null, item);
            } else {
                item.amphora = {publication: {pages:[]}};
                withAuth(auth, function(auth) {
                    fetchResource(item.amphora, item.url, auth, function(err) {
                        auth.done(function() {
                            if (err) {
                                console.log('Failed to fetch amphora resource: ' + JSON.stringify(err));
                                callback(err);
                            } else {
                                formatter.cleanup(item, callback, currentPage);
                            }
                        });
                    });
                });
            }
        }
    };
};
