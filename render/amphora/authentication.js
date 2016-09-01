/**
 * Provide authentication for amphora.
 **/
module.exports = function (config, restler) {
    return {
        login: function(callback) {
            restler.postJson(config.authentication.endpoint, {
                'userName': config.authentication.user,
                'plainPassword': config.authentication.password
            }).on('complete', function(data) {
                if (data instanceof Error) {
                    callback(data);
                } else {
                    callback(null, JSON.parse(data).sessionId);
                }
            });
        },

        logout: function(token, callback) {
            restler.del(config.authentication.endpoint + '/' + token);
            callback(null);
        }
    };
};
