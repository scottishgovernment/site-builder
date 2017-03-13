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
                if (context.authToken) {
                    content.forToken = context.authToken;
                }
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
        var headers = {};
        if (this.authToken && this.authToken !== 'undefined') {
            headers.Authorization = 'Bearer ' + this.authToken;
            var content = this.app.contentSource.fetchItemSync(path, headers, 'preview');
            content.forToken = this.authToken;
            return content;
        } else {
            return this.app.contentSource.fetchItemSync(path, headers, 'stage');
        }
    }

    filter(params, callback) {
        var context = this;
        var headers = {};
        if (context.authToken) {
            headers.Authorization = 'Bearer ' + context.authToken;
        }
        context.app.contentSource.filter(params, headers, context.visibility, function(err, list) {
            if (err) {
                callback(err);
            } else {
                callback(null, list);
            }
        });
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
