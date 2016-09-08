var sut = require('../../out/instrument/publish/item-labeller')();

describe('item-labeller', function() {

    function formatObj(name, description, categoryId) {
        return {
            name: name,
            description: description,
            _embedded: {
                category: {
                    id : categoryId
                }
            }
        };
    }

    function item(format, publicationType) {

        if (typeof format === 'string') {
            format = formatObj(format, '', '');
        }
        return {
            contentItem : {
                publicationType: publicationType,
                _embedded : {
                    format : format
                }
            }
        };
    }

    it('ARTICLE does not assign a label', function() {

        // ARRANGE
        var input = item('ARTICLE');
        var expected = '';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });

    it('PRESS_RELEASE assigns "news"', function() {

        // ARRANGE
        var input = item('PRESS_RELEASE');
        var expected = 'news';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });

    it('POLICY assigns "policy"', function() {

        // ARRANGE
        var input = item('POLICY');
        var expected = 'policy';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });

    it('POLICY_DETAIL assigns "policy"', function() {

        // ARRANGE
        var input = item('POLICY_DETAIL');
        var expected = 'policy';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });

    it('POLICY_LATEST assigns "policy"', function() {

        // ARRANGE
        var input = item('POLICY_LATEST');
        var expected = 'policy';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });


    it('APS_PUBLICATION assigns "publication - [publicationType]"', function() {

        // ARRANGE
        var input = item('APS_PUBLICATION', 'MAP');
        var expected = 'publication - map';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });

    it('non-aps-publication assigns "publication - [formatDescription]"', function() {

        // ARRANGE
        var input = item(formatObj('ADVICE_GUIDANCE', 'Advice and guidance', 'publications-non-aps'));
        var expected = 'publication - advice and guidance';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });

});
