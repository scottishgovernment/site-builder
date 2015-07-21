// ContentHandler that logs the content items being handled.
var config = require('config-weaver').config();

module.exports = function(grunt) {

    var needle = require('needle');
    var count = 0;

    function log(method, data, status) {
        grunt.log.writeln('Create YAML ' + data['cyan'] + ' ' + status['green']);
    }

    return {

        // called when the content source is starting
        start: function(callback) {
            log("Start", "", "");
            callback();
            count = 0;
        },

        // called for each content item provided by the content source
        handleContentItem: function(item, callback) {
            count++;
            log("processing", item.contentItem.slug, "OK");
            callback();
        },

        // called when the content source will provide no more items
        end: function(err, callback) {
            var content = {
                pub: {
                    createdby: config.authentication.user,
                    itemcount: count
                }
            };

            var options = {
                json: true,
                content_type: 'application/json'
            };

            needle.post(config.crud.endpoint + '/api/pub', content, options, function() {
                grunt.log.ok('Create YAML end ' + count.toString()['green'] + ' items');
                callback();
            });
        }
    };
};
