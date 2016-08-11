var sutPath = '../../../out/instrument/render/amphora/publication-formatter';

var formatter = require(sutPath)();

var item = {
	contentItem: {
	   title: 'my-publication-updated-title'
    },
	amphora: {
		publication: {
			title: 'my-publication',
			documents:[],
			pages:[{
					source:{}
				}, {
                    source:{}
				}
			]
		}
	}
}
// TODO write tests
describe('format amphora resource for publication', function() {
    it('cleanup', function () {
    	formatter.cleanup(item, function(){
    		expect(item.amphora.publication.title).toEqual('my-publication-updated-title');
    	});
    });
});
