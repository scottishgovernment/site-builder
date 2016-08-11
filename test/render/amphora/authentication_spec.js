var sutPath = '../../../out/instrument/render/amphora/authentication';
var authentication = require(sutPath)({authentication:{
	endpoint:'/sessions'
}}, {
	postJson : function(val) {
		return {
			on: function(status) {
				return 'token';
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

     it('logging out', function () {
    	authentication.logout('token', function(err) {
    		expect(err).toEqual(null);
    	});
    });
   
});
