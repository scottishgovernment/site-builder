'use strict';

/**
 * Grunt task to check for broken links
 *
 * Uses 'simplewebcrawler' to crawl the website and send results to the healthcheck web RESY service
 */
module.exports = function(grunt) {

    var config = require('config-weaver').config();
    var restler = require('restler');
    var url = require('url');
    var StringDecoder = require('string_decoder').StringDecoder;
    var decoder = new StringDecoder('utf8');
    var cheerio = require('cheerio');
    var async = require('async');
    var Crawler = require("simplecrawler-referrer-filter");
    var crawler = Crawler.crawl(config.healthcheck.crawlUrl);
    var urlToUUIDMap = {};
    var crawlNumber = 1;

    var lastActivity = Date.now();

    var stoplist = [
        'https://www.owasp.org/index.php/Clickjacking_Defense_Cheat_Sheet--',
        'https://fonts.googleapis.com/css'
    ];


    // remember the url for this uuid
    function mapUrlToUuid(url, uuid) {
        urlToUUIDMap[url] = uuid;
    }

    // get the uuid for this url
    function uuidForUrl(url) {
        if (url !== undefined) {
            return urlToUUIDMap[url];
        } else {
            return '';
        }
    }

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    // record an issue by sending it to the healthcheck service
    function recordIssue(queueItem) {

        lastActivity = Date.now();
        var myGovPath = queueItem.referrer;

        if (myGovPath !== undefined) {
            myGovPath = url.parse(myGovPath).pathname;
        } else {
            myGovPath = '';
        }
        var redirectUrl = '';
        if (queueItem.stateData.headers) {
            redirectUrl = queueItem.stateData.headers.location;
        }
        var data = {
            crawlNumber: crawlNumber,
            url: queueItem.url,
            redirectUrl: redirectUrl,
            path: myGovPath,
            contentItemId: uuidForUrl(myGovPath),
            status: queueItem.stateData.code
        };

        var urlDetails = myGovPath + ' -> ' + data.url + ' ' + data.status;

        // log colour coded message
        if (endsWith(myGovPath, '.css') || endsWith(myGovPath, '.js')) {
            console.log(urlDetails['grey']);
            return;
        }

        // only record if not in the stop list
        if (stoplist.indexOf(queueItem.url) !== -1) {
            console.log(urlDetails['grey']);
            return;
        }

        // convert errors into 404's
        if (!data.status) {
            data.status = 404;
        }

        if (data.status >= 200 && data.status <= 299) {
            console.log(urlDetails['cyan']);
        } else if (data.status >= 300 && data.status <= 399) {
            console.log(urlDetails['yellow']);
        } else {
            console.log(urlDetails['red']);
        }


        // post to the healthcheck endpoint
        restler.postJson(config.healthcheck.repoUrl, data)
            .on('complete', function() {});
    }

    function getCrawlNumber(callback) {
        restler.get(config.healthcheck.repoUrl + '/search/lastCrawl')
            .on('complete', function(data) {
                if (data === '') {
                    crawlNumber = 0;
                } else {
                    crawlNumber = data + 1;
                }
                callback();
            });
    }

    function crawl(callback) {
        crawler
            .on("fetchcomplete", function(queueItem, responseBuffer) {
                // parse out the uuid and then map it to its url
                var decodedResponse = decoder.write(responseBuffer);
                var $ = cheerio.load(decodedResponse);
                var uuid = $('body').attr('data-uuid');
                mapUrlToUuid(url.parse(queueItem.url).pathname, uuid);

                // record the issue
                recordIssue(queueItem);
            })
            .on("fetch404", function(queueItem) {
                recordIssue(queueItem);
            })
            .on("fetcherror", function(queueItem) {
                recordIssue(queueItem);
            })
            .on("fetchclienterror", function(queueItem) {
                recordIssue(queueItem);
            })
            .on("fetchredirect", function(queueItem) {
                recordIssue(queueItem);
            })
            .on("complete", function() {
                console.log('Crawl Complete.');
                callback();
            });
    }

    grunt.registerTask('checklinks', 'Crawl the website checking for broken links',
        function() {
            // feature flag for the web crawler
            if (!config.healthcheck.enable) {
                console.log('healthcheck disbaled' ['red'].bold);
                return;
            }
            var timeoutMillis = config.healthcheck.crawlTimeoutMins * 60 * 1000;
            console.log('Timeout millis is ' + timeoutMillis);
            var release = this.async();

            function checkInactivity() {
                var now = Date.now();
                var elapsed = now - lastActivity;

                if (elapsed > timeoutMillis) {
                    console.log(('No activity for ' + config.healthcheck.crawlTimeoutMins + ' mins, stopping')['red'].bold);
                    release();
                }
            }
            setInterval(checkInactivity, 5000);

            // do not filter by domain but do limit the depth
            crawler.filterByDomain = false;
            crawler.filterByReferrerDomain = true;
            crawler.interval = 10;
            crawler.maxConcurrency = 10;
            crawler.timeout = 30000;
            crawler.stripQuerystring = false;
            crawler.parseScriptTags = false;
            crawler.parseHTMLComments = false;

            async.series([getCrawlNumber, crawl],
                function(err) {
                    if (err) {
                        grunt.fail.fatal('Error checking links: ' + JSON.stringify(err));
                    }
                    release();
                });
        }
    );
};
