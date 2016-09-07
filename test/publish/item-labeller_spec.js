//var sut = require('../../out/instrument/publish/item-labeller')();
var sut = require('../../publish/item-labeller')();

describe('item-labeller', function() {

    function formatObj(name, categoryId) {
        return {
            name: name,
            _embedded: {
                category: {
                    id : categoryId
                }
            }
        };
    }

    function item(format, publicationType) {

        if (typeof format === 'string') {
            format = formatObj(format, '');
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

    it('PRESS_RELEASE assigns NEWS', function() {

        // ARRANGE
        var input = item('PRESS_RELEASE');
        var expected = 'NEWS';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });

    it('POLICY assigns POLICY', function() {

        // ARRANGE
        var input = item('POLICY');
        var expected = 'POLICY';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });

    it('POLICY_DETAIL assigns POLICY', function() {

        // ARRANGE
        var input = item('POLICY_DETAIL');
        var expected = 'POLICY';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });

    it('POLICY_LATEST assigns POLICY', function() {

        // ARRANGE
        var input = item('POLICY_LATEST');
        var expected = 'POLICY';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });


    it('APS_PUBLICATION assigns PUBLICATION - publicationType', function() {

        // ARRANGE
        var input = item('APS_PUBLICATION', 'MAP');
        var expected = 'PUBLICATION - MAP';

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });

    it('non-aps-publicaiton assigns PUBLICATION - formatName', function() {

        // ARRANGE
        var input = item(formatObj('MAP', 'publications-non-aps'));
        var expected = 'PUBLICATION - MAP';

        console.log('-----');
        console.log('-----');
        console.log('-----');
        console.log(JSON.stringify(input, null, '\t'));
        console.log('-----');
        console.log('-----');
        console.log('-----');

        // ACT
        var actual = sut.label(input);

        // ASSERT
        expect(actual).toEqual(expected);
    });

});
