var sutPath = '../../../out/instrument/render/amphora/page-content-handler';

var handler = require(sutPath)();

var item = {
	amphora: {
		publication:{
			title:'my-publication',
			documents:[],
			pages:{ '0':{
					source:{}
			}}
		}
	}
};

var page = {
	path:'/publications/my-publication/pages/0/index-html/',
	metadata:{
		type: 'publication-page-content'
	},
	slug : '0',
	storageContent: 'PGh0bWw+PGgzPm15LXRpdGxlPC9oMz48L2h0bWw+', //'<html><h3>my-title</h3></html>'
	_links : {
		'inline' : '/storage/publications/my-publication/pages/0/index-html/'
	}
};

describe('handle publication page', function() {
    it('handle', function () {
    	handler.handle(item.amphora, page, function(){
    		expect(item.amphora.publication.pages[page.slug].title).toEqual('my-title');
    	});
    });
});
