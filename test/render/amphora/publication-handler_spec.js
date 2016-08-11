var sutPath = '../../../out/instrument/render/amphora/publication-handler';

var handler = require(sutPath)();

var item = {
	amphora: {
	
	}
};

var resource = {
	path:'/publications/my-publication/',
	metadata:{
		source: {
			title:'My Publication'
		},
		type: 'publication'
	},
	slug : 'my-publication',
};

describe('handle publication resource', function() {
    it('handle', function () {
    	handler.handle(item.amphora, resource, function(){
    		expect(item.amphora.publication).toEqual(resource.metadata.source);
    	});
    });
});
