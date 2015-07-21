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

    grunt.registerMultiTask('yellio', 'Broadcasts message', function() {

        var release = this.async();
        var fileCount;

        //Record the build time
        if (this.target === 'buildStart') {
            startTime = new Date();
            release(true);
        } else if (this.target === 'buildComplete') {

            endTime = new Date();
            buildTime = endTime - startTime;

            var dir = grunt.config('site.contentitems');

            fs.readdir(dir, function(err, files) {
                if (err) {
                    throw err;
                }

                files.map(function(file) {
                    return path.join(dir, file);
                }).filter(function(file) {
                    return fs.statSync(file).isDirectory();
                });

                fileCount = files.length;

                var postURL = url.parse(config.crud.endpoint);

                //Build up the message to save to CRUD
                var content = JSON.stringify({
                    pub: {
                        createdby: config.authentication.user,
                        itemcount: fileCount,
                        buildTime: buildTime
                    }
                });

                //Record the publishing job
                var options = {
                    host: postURL.hostname,
                    port: postURL.port,
                    path: path.join(postURL.pathname, '/api/pub'),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': content.length
                    }
                };

                var req = http.request(options, function(res) {
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        release(true);
                    });
                });
                req.on('error', function(e) {
                    console.log('Could not log publish: ' + content + '\n', e);
                    release(true);
                });
                req.write(content);
                req.end();
            });

        } else {
            release(true);
        }

    });

};
