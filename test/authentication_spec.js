var sutPath = '../out/instrument/preview/authentication';
describe('authentication', function() {

    it('Can login', function(done) {
        var restler = {
            postJson: function(url, cred) {
                return {
                    on: function(event, callback) {
                        callback(JSON.stringify({
                            sessionId: 'validsession'
                        }), {
                            statusCode: 201
                        });
                    }
                }
            }
        };
        var sut = require(sutPath)({
            authentication: {
                enabled: true
            }
        }, restler);
        sut.login(function(error, result) {
            expect("validsession").toEqual(result.sessionId);
            done();
        });

    });

    it('Can logout', function(done) {
        var restler = {
            del: function(url) {
                done();
            }
        };
        var sut = require(sutPath)({
            authentication: {
                enabled: true
            }
        }, restler);
        sut.logout('validsession');

    });

    it('To header', function(done) {
        var sut = require(sutPath)({
            authentication: {
                enabled: true
            }
        }, {});
        var expected = {
            headers: {
                'Authorization': 'Bearer session'
            }
        };
        expect(expected).toEqual(sut.toHeader('session'));
        done();
    });

    it('Invalid credentials', function(done) {
        var restler = {
            postJson: function(url, cred) {
                return {
                    on: function(event, callback) {
                        callback(null, {
                            statusCode: 404
                        })
                    }
                }
            }

        };
        var sut = require(sutPath)({
            authentication: {
                enabled: true
            }
        }, restler);
        sut.login(function(error, result) {
            expect(result).toBeNull();
            expect(error).toBeDefined();
            done();
        });

    });

    it('Can work without authentication', function(done) {
        var sut = require(sutPath)({
            authentication: {
                enabled: false
            }
        }, {});
        sut.login(function(error, res) {
            expect(error).toBeNull();
            sut.logout('na');
            done();
        });

    });
});
