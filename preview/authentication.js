function doLogin(url, cred, restler, callback) {
    restler.postJson(url, cred).on('complete', function(data, response) {
        if (data instanceof Error || response.statusCode >= 400) {
            var error = {
                status: response.statusCode,
                message: 'Failed to login: ' + data
            };
            callback(error, null);
        } else {
            var auth = JSON.parse(data);
            callback(null, auth);
        }
    });
}

module.exports = function(config, restler) {
    var cred = {
        "userName": config.authentication.user,
        "plainPassword": config.authentication.password
    };
    return {
        login: function(callback) {
            if (config.authentication.enabled) {
                doLogin(config.authentication.endpoint, cred, restler, callback);
            } else {
                callback(null, {
                    sessionId: ''
                });
            }
        },
        logout: function(session) {
            if (config.authentication.enabled) {
                restler.del(config.authentication.endpoint + '/' + session);
            }
        },
        toHeader: function(session) {
            return {
                headers: {
                    'Authorization': 'Bearer ' + session
                }
            };
        }
    };
};
