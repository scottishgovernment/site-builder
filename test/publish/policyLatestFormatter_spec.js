var sut = require('../../out/instrument/publish/policyLatestFormatter')();

describe('policyLatestFormatter', function() {

    var input = {
            uuid : 'item-uuid',
            url : '/item-url/',
            contentItem : {
                uuid : 'item-uuid',
                title : 'item title',
                summary : 'item summary',
                _embedded : {

                }
            },
            ancestors : []
        };

    it('greenpath', function() {
        var actual = sut.formatLatest(input);
        expect(actual.layout).toEqual('policy-latest.hbs');
        expect(actual.uuid).toEqual('item-uuid-latest');
        expect(actual.url).toEqual('/item-url/latest/');
        expect(actual.contentItem.uuid).toEqual('item-uuid-latest');
        expect(actual.contentItem._embedded.parent.uuid).toEqual(input.uuid);
    });

});
