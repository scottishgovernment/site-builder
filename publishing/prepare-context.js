'use strict';

/**
 * Base class for all formats.
 **/


class PrepareContext {

    constructor(app, visibility, authToken) {
        this.app = app;
        this.visibility = visibility;
        this.authToken = authToken;
        this.attributes = {
            dateCreated: new Date().getTime(),
        };
    }

    fetchItem(path, callback) {
        var context = this;
        var headers = {};
        if (context.authToken) {
            headers.Authorization = 'Bearer ' + context.authToken;
        }
        context.app.contentSource.fetchItem(path, headers, context.visibility, function(err, content) {
            if (err) {
                callback(err);
            } else {
                content.stagingEnvironment = context.visibility === 'stage';
                context.attributes[content.uuid] = {
                    fetched: new Date().getTime(),
                    path: path,
                    store: true
                };
                context.app.prepare(context, content, callback);
            }
        });
    }

    fetchItemSync(path) {
        return this.app.contentSource.fetchItemSync(path);
    }

    fetchUrlsById(ids, callback) {
        var headers = {};
        if (this.authToken) {
            headers.Authorization = 'Bearer ' + this.authToken;
        }
        this.app.contentSource.fetchUrlsById(ids, headers, callback);

    }
}

module.exports = PrepareContext;