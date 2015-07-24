var sutPath = '../../out/instrument/preview/routes';
describe('routes', function() {

    var source = {
        fetch: function(path, auth, visibility, callback) {
            callback(null, 'content-item');
        }
    };

    var sourceBad = {
        fetch: function(path, auth, visibility, callback) {
            callback('bad source', null);
        }
    };

    var engine = {
        render: function(item, callback) {
            callback(null, 'rendered-' + JSON.stringify(item));
        }
    };

    var engineBad = {
        render: function(item, callback) {
            callback('template-notfound', null);
        }
    };

    var req = {
        query: {
            token: 'token'
        },
        cookies: {
        },
        headers: {
        },
        path: '/item/guide-page'
    };

    var res = function(done, expectedbody) {
        return {
            status: function(code) {
                return {
                    send: function(content) {
                        expect(content).toBe(expectedbody);
                        done();
                    }
                };
            },
            cookie: function(name, value) {

            }
        }
    };

    it('Preview', function(done) {
        var sut = require(sutPath)(source, engine);
        sut.preview(req, res(done, 'rendered-"content-item"'));
    });

    it('Preview with source error', function(done) {
        var sut = require(sutPath)(sourceBad, engine);
        sut.preview(req, res(done, 'rendered-{\"body\":\"There was an error\",\"layout\":\"_error.hbs\",\"statusCode\":400,\"message\":\"bad source\"}'));
    });

    it('Preview with template error', function(done) {
        var sut = require(sutPath)(source, engineBad);
        sut.preview(req, res(done, null));
    });
});
