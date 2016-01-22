// ContentHandler that ditributes events to other handlers
module.exports = function(handlers) {
    var async = require('async');

    return {
        start: function(callback) {
            async.each(handlers,
                // for each call the handler
                function(handler, eachCallback) {
                    handler.start(eachCallback);
                },
                // called when all are finished
                function() {
                    callback();
                });
        },

        handleContentItem: function(contentItem, callback) {
            async.eachSeries(handlers,
                // for each call the handler
                function(handler, eachCallback) {
                    handler.handleContentItem(contentItem, eachCallback);
                },
                // called when all are finished
                function(err) {
                    callback(err);
                }
            );
        },

        end: function(err, callback) {
            async.eachSeries(handlers,
                // for each call the handler
                function(handler, eachCallback) {
                    handler.end(err, eachCallback);
                },
                // called when all are finished
                function() {
                    callback(err);
                }
            );
        }
    };
};
