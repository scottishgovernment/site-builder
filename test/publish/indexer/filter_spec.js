var sutPath = '../../../out/instrument/publish/indexer/filter';

var sut = require(sutPath);

describe('filter', function() {

    function item(formatname, siteSearchable, incumbent) {
        var ret = {

            contentItem: {
                _embedded: {
                    format: {
                        name: formatname,
                        _embedded: {
                            siteSearchable : siteSearchable
                        }
                    }
                }
            },
            inverseRelatedItems : {
                hasIncumbent: []
            }

        };

        if (incumbent) {
            ret.inverseRelatedItems.hasIncumbent.push({ uuid: incumbent});
        }

        return ret;
    }


    it('accepts site indexable items', function() {
        // ARRANGE
        var input = item('ARTICLE', true);
        var expected = true;

        // ACT
        var actual = sut.accept(input);

        //ASSERT
        expect(actual).toEqual(expected);
    });

    it('rejects non site indexable items', function() {
        // ARRANGE
        var input = item('CATEGORY_LIST', false);
        var expected = false;

        // ACT
        var actual = sut.accept(input);

        //ASSERT
        expect(actual).toEqual(expected);
    });

    it('rejects person with incumbent', function() {
        // ARRANGE
        var input = item('PERSON', true, 'first-minister');
        var expected = false;

        // ACT
        var actual = sut.accept(input);

        //ASSERT
        expect(actual).toEqual(expected);

    });

    it('accepts person with no incumbent', function() {
        // ARRANGE
        var input = item('PERSON', true, null);
        var expected = true;

        // ACT
        var actual = sut.accept(input);

        //ASSERT
        expect(actual).toEqual(expected);

    });
});
