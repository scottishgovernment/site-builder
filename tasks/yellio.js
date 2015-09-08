'use strict';

module.exports = function(grunt) {

    var config = require('config-weaver').config();

    var fs = require('fs'),
        path = require("path"),
        http = require('http'),
        url = require('url');

    var startTime,
        endTime,
        buildTime;

    function post(content, release) {
        var postURL = url.parse(config.crud.endpoint);
        var payload = JSON.stringify(content);

        //Record the publishing job
        var options = {
            host: postURL.hostname,
            port: postURL.port,
            path: path.join(postURL.pathname, '/api/pub'),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        };

        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                release(true);
            });
        });
        req.on('error', function (e) {
            console.log('Could not log publish: ' + content + '\n', e);
            release(true);
        });
        req.write(payload);
        req.end();
    }

    function buildDone(release) {
        endTime = new Date();
        buildTime = endTime - startTime;

        var dir = grunt.config('site.contentitems');

        fs.readdir(dir, function (err, files) {
            if (err) {
                throw err;
            }

            files.map(function (file) {
                return path.join(dir, file);
            }).filter(function (file) {
                return fs.statSync(file).isDirectory();
            });

            var fileCount = files.length;

            //Build up the message to save to CRUD
            var content = {
                pub: {
                    createdby: config.authentication.user,
                    itemcount: fileCount,
                    buildTime: buildTime,
                    type: 'site'
                }
            };
            post(content, release);
        });

    }

    function redirectsDone(release) {
        endTime = new Date();
        buildTime = endTime - startTime;
        var content = {
            pub: {
                createdby: config.authentication.user,
                buildTime: buildTime,
                type: 'redirects'
            }
        };
        post(content, release);
    }

    grunt.registerMultiTask('yellio', 'Broadcasts message', function() {
        var release = this.async();

        //Record the build time
        if (this.target === 'buildStart') {
            startTime = new Date();
            release(true);
        } else if (this.target === 'buildComplete') {
            buildDone(release);
        } else if (this.target === 'redirectsComplete') {
            redirectsDone(release);
        }
    });

};
