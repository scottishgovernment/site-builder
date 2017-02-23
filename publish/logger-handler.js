module.exports = function(app, grunt) {

    var needle = require('needle');
    var deleteCount = 0;
    var count = 0;
    var killerItem = {
        time: 0,
        uuid: ''
    };

    function log(method, data, status) {
        grunt.log.writeln(method + ' ' + data['cyan'] + ' ' + status['green']);
    }

    return {

        // called when the content source is starting
        start: function(callback) {
            log('Create YAML Start', '', '');
            count = 0;
            deleteCount = 0;
            callback();
        },

        // called for each content item that has been removed
        removeContentItem: function (context, id, callback) {
            log('Remove YAML', id, 'OK');
            deleteCount++;
            callback();
        },

        // called for each content item provided by the content source
        handleContentItem: function(context, content, callback) {
            count++;
            var ended = new Date().getTime();
            var elapsed = (ended - context.attributes[content.uuid].fetched);
            var requestTime = (ended - context.attributes.dateCreated);
            if (killerItem.time > elapsed) {
                killerItem.time = elapsed;
                killerItem.uuid = content.uuid;
            }
            log('Create or Update YAML', content.uuid + ' ' + content.contentItem.slug
                + ' prepare:' + elapsed + ' total-context-time: ' + requestTime, 'OK');
            callback();
        },

        // called when the content source will provide no more items
        end: function(err, callback) {
            var content = {
                pub: {
                    createdby: app.config.authentication.user,
                    itemcount: count
                }
            };

            var options = {
                json: true,
                content_type: 'application/json'
            };
            needle.post(app.config.crud.endpoint + '/api/pub', content, options, function() {
                grunt.log.ok('Create YAML end. Deleted '
                + deleteCount.toString()['green'] + ' items, '
                + 'wrote ' + count.toString()['green'] + ' items');
                callback();
            });
        }
    };
};
