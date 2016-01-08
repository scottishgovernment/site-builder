'use strict';

module.exports = function(grunt) {

    var config = require('config-weaver').config();

    var fs = require('fs'),
        path = require("path"),
        http = require('http'),
        url = require('url');

    var startTime,
        endTime;

    function post(content, callback) {
      var postURL = url.parse('http://localhost:5984/publish');
      var payload = JSON.stringify(content);

      //Record the publishing job
      var options = {
          host: postURL.hostname,
          port: postURL.port,
          path: postURL.path,
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Content-Length': payload.length
          }
      };

      var req = http.request(options, function (res) {
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
              callback(true);
          });
      });
      req.on('error', function (e) {
          console.log('Could not log publish: ' + content + '\n', e);
          callback(true);
      });
      req.write(payload);
      req.end();
    }

    function buildDone(release) {
        endTime = new Date();
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

            post({
                type: 'publish',
                what: 'site',
                user: config.authentication.user,
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                items: fileCount
            }, release);
        });

    }

    function redirectsDone(release) {
        endTime = new Date();
        post({
          type: 'publish',
          what: 'redirects',
          user: config.authentication.user,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        }, release);
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
