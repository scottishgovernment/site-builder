module.exports = function (config) {

    var restler = require('restler'),
        path = require('path'),
        handlebars = require('handlebars'),
        async = require('async'),
        fs = require('fs-extra'),
        url = require('url');

    var pagesTemplateSrc = fs.readFileSync(__dirname + '/decommissioned-sites.hbs', 'UTF-8');
    var pagesTemplate = handlebars.compile(pagesTemplateSrc);

    var sites;
    var authtoken;

    function headers() {
        return {
            headers: {
               'Authorization': 'Bearer ' + authtoken
            }
        };
    }

    function login(done) {
        if (!config.authentication.enabled) {
            done();
            return;
        }
        restler.postJson(config.authentication.endpoint,
            {
                'userName': config.authentication.user,
                'plainPassword': config.authentication.password
            })
        .on('complete', function(data) {
            if (data instanceof Error) {
                done(data);
            } else {
                authtoken = JSON.parse(data).sessionId;
                done();
            }
        });
    }

    function fetchSites(done) {
        restler.get(config.decommissionTool.url+'redirects/sites', headers()).on('complete',
            function (data, response) {
                if (response.statusCode === 200) {
                    sites = JSON.parse(data);

                    done();
                } else {
                    done('Error fetching sites: '+JSON.stringify(data, null, '\t'));
                }
            });
    }

    function fetchPagesForSites(done) {

        if (sites._embedded && sites._embedded.sites) {
            async.forEach(sites._embedded.sites, fetchPageForSite,
                function (err) {
                    if (err) {
                        done('Error fetching pages: ' + JSON.stringify(err));
                    } else {
                        done();
                    }
                }
            );

        } else {
            done();
        }

    }

    function escapeRegExpChars(str) {
        return str.replace(/['-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    function sourceUrl(page) {
        var srcUrl = page.srcUrl;

        if (page.type === 'EXACT') {
            srcUrl = escapeRegExpChars(decodeURI(srcUrl));
        }

        var endsWithSlash = srcUrl.charAt(srcUrl.length - 1) === '/';
        return '(?i)^' + srcUrl + (endsWithSlash ? '?' : '/?') + '$';
    }

    // if the target url is a fully qualified url then just use it as the target url.
    // Otherwise add the base usrl to the front.
    function targetUrl(target, base) {
        if (target.indexOf('http') === 0) {
            return target;
        } else {
            return base+target;
        }
    }

    //The redirect type is the flag used on the rewrite directive
    //It can only have the values redirect or permanent, lower-case, and default
    //to permanent
    function sanitiseRedirectType(page) {
        var type = page.redirectType;
        if (type && type.toLowerCase() === 'redirect') {
            return 'redirect';
        }
        return 'permanent';
    }

    function fetchPageForSite(site, callback) {
        restler.get(site._links.pages.href, headers()).on('complete',
            function (data, response) {
                if (response.statusCode !== 200) {
                    callback('Error fetching pages: '+JSON.stringify(data, null, '\t'));
                }

                var pagesJSON = JSON.parse(data);
                if (pagesJSON._embedded === undefined) {
                    callback();
                    return;
                }

                // Ensure site URL has no trailing slash:
                var siteUrl = url.parse(config.decommissionTool.siteUrl).href.slice(0,-1);

                // sort the pages so that exact mathces come first followed by
                // regexps
                pagesJSON._embedded.pages =
                    pagesJSON._embedded.pages.sort(function (a, b) {

                        if (a.type === b.type) {
                            return a.srcUrl.localeCompare(b.srcUrl);
                        }

                        if (a.type === 'EXACT') {
                            return -1;
                        }

                        return 1;
                    });

                var pages = [];
                for (var i = 0; i < pagesJSON._embedded.pages.length; i++) {
                    var page = pagesJSON._embedded.pages[i];
                    pages.push({
                        source: sourceUrl(page),
                        target: targetUrl(page.targetUrl, siteUrl),
                        rewriteFlag: sanitiseRedirectType(page)
                    });
                }

                var srcDoc = {
                    name: site.name,
                    host: site.host,
                    url: siteUrl,
                    catchAllUri: site.catchAllUri,
                    pages: pages
                };

                var content = pagesTemplate(srcDoc);

                var decommissionDir = path.join(config.tempdir, 'nginx', 'decommissioned');
                fs.mkdirsSync(decommissionDir);

                var firstHost = site.host.split(' ')[0];
                var filename = path.join(decommissionDir, firstHost + '.conf');
                fs.writeFile(filename, content, 'UTF-8', callback);
            }
        );
    }

    function logout(done) {
        if (config.authentication.enabled) {
            restler.del(config.authentication.endpoint + '/' + authtoken);
        }
        done();
    }

    return {
        createRedirects : function(callback) {
            if (!config.decommissionTool.enabled) {
                callback();
            } else {
                async.series([login, fetchSites, fetchPagesForSites, logout], callback);
            }
        }
    };
};
