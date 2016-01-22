'use strict';

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number'
                || !isFinite(position)
                || Math.floor(position) !== position
                || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}

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

            var items = files.filter(function (file) {
                return file.endsWith(".yaml");
            }).length;

            var fileCount = files.length;

            post({
                type: 'publish',
                what: 'site',
                user: config.authentication.user,
                start: startTime.toISOString(),
                end: endTime.toISOString(),
                items: items
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
