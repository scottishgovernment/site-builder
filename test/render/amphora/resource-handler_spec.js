var sutPath = '../../../out/instrument/render/amphora/resource-handler';

var handler = require(sutPath)();

var item = {
	amphora: {
		publication:{
			title:'my-publication',
			documents:[],
			pages:[{source:{}}]
		}
	}
};

var resource = {
	path:'/publications/my-publication/pages/0/',
	metadata:{
		source: {
		},
		type: 'publication-page'
	},
	slug : '0',
	_links : {
	}
};


// TODO write unit tests
describe('handle publication resource', function() {
    it('handle', function () {
    	handler.handle(item.amphora, resource, function(){
    		
    	});
    });
});
