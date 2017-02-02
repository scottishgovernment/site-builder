module.exports = function(handlers) {
    var async = require('async');

    return {
        start: function(callback) {
            async.each(handlers,
                (handler, cb) => handler.start(cb),
                callback);
        },

        removeContentItem: function(context, content, callback) {
            async.eachSeries(handlers,
                (handler, cb) => handler.removeContentItem(context, content, cb),
                callback);
        },

        handleContentItem: function(context, content, callback) {
            async.eachSeries(handlers,
                (handler, cb) => handler.handleContentItem(context, content, cb),
                callback);
        },

        end: function(err, callback) {
            async.eachSeries(handlers,
                (handler, cb) => handler.end(err, cb),
                callback);
        }
    };
};
