var sutPath = '../../../out/instrument/render/amphora/authentication';
var i = 0;
var authentication = require(sutPath)({authentication:{
	endpoint:'/sessions'
}}, {
	postJson : function(val) {
		return {
			on: function(status, callback) {
				callback('{"sessionId":"token"}');
			}
		}
	},
	del: function() {
		return true;
	}
});


var authenticationBad = require(sutPath)({authentication:{
	endpoint:'/sessions'
}}, {
	postJson : function(val) {
		return {
			on: function(status, callback) {
				callback(new Error('connection refused'));
			}
		}
	},
	del: function() {
		return true;
	}
});





describe('login/logout', function() {

    it('loging in', function () {
    	authentication.login(function(err, val) {
    		expect(err).toEqual(null);
    		expect(val).toEqual('token')
    	});
    });

		it('loging in, bad auth', function () {
    	authenticationBad.login(function(err, val) {
    		expect(err).not.toBeNull();
    	});
    });

     it('logging out', function () {
    	authentication.logout('token', function(err) {
    		expect(err).toEqual(null);
    	});
    });

});
