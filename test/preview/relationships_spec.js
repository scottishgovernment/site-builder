//var sutPath = '../../out/instrument/preview/relationships';
var sutPath = '../../preview/relationships';
describe('relationships', function() {

    function testItem(layout) {
        return {
            uuid: 'uuid',
            layout : layout,
            inverseRelatedItems : {
                hasIncumbent : []
            },

            relatedItems : {
                hasResponsibleDirectorate: [],
                hasSecondaryResponsibleDirectorate : [{uuid : 'resp-dir-1'}, {uuid : 'resp-dir-2'}],
                hasResponsibleRole: [{uuid:'resp-role'}],
                hasSecondaryResponsibleRole: [{uuid:'resp-role'}], // duplicate!
                hasIncumbent: [{uuid: 'person'}],
                hasOrganisationalRole: [{uuid: 'uuid'}], // should not be included
                hasSecondaryOrganisationalRole: [],
                hasParent: [{uuid: 'parent'}]
            },
            descendants : [{url: 'desc-1'}, {url: 'desc-2'}],

        }
    }


    it('find returns expected for article', function() {

        var relationships = new require(sutPath);
        var sut = new relationships.Relationships();
        var actual = sut.find(testItem('article.hbs'));

        expect(actual).toEqual(
            [
                { uuid: 'resp-dir-1' },
                { uuid: 'resp-dir-2' },
                { uuid: 'resp-role' },
                { uuid: 'resp-role' },
                { uuid: 'person' }
            ]);
    });


    it('find returns expected for policy', function() {

        var relationships = new require(sutPath);
        var sut = new relationships.Relationships();
        var actual = sut.find(testItem('policy.hbs'));

        expect(actual).toEqual(
            [
                { uuid: 'resp-dir-1' },
                { uuid: 'resp-dir-2' },
                { uuid: 'resp-role' },
                { uuid: 'resp-role' },
                { uuid: 'person' },
                { url: 'desc-1'},
                { url: 'desc-2'}
            ]);
    });

    it('find returns expected for policy detail', function() {

        var relationships = new require(sutPath);
        var sut = new relationships.Relationships();
        var actual = sut.find(testItem('policy-detail.hbs'));

        expect(actual).toEqual(
            [
                { uuid: 'resp-dir-1' },
                { uuid: 'resp-dir-2' },
                { uuid: 'resp-role' },
                { uuid: 'resp-role' },
                { uuid: 'person' },
                {uuid: 'parent'}
            ]);
    });
});
