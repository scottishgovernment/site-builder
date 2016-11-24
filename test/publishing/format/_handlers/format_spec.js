var sutPath = '../../../../out/instrument/publishing/format/_handlers/format';

var sutClass = require(sutPath);
var sut = new sutClass;
describe('format', function() {

    describe('layout', function() {

        function itemWithFormatName(formatName) {
            return {
                    contentItem: {
                        _embedded: {
                            format: {
                                name: formatName
                            }
                        }
                    }
                }
        }

        it('assign expected layout', function() {

            // ARRANGE
            // content.contentItem._embedded.format.name
            var input = itemWithFormatName("FORMAT_NAME");
            var expected = 'format-name.hbs';

            // ACT
            var actual = sut.layout(input);

            // ASSERT
            expect(actual).toEqual(expected);
        });
    });


    describe('prepareForRender', function() {

        function item() {
            return {
                uuid: 'uuid'
            }
        }

        it('item unchanged', function(done) {

            // ARRANGE
            var input = item();
            var expected = item();
            var context = {attributes:{'uuid':{}},app:{context:{itemUrlMap:{}}}};

            // ACT
            sut.prepareForRender(context, input, function (err, actual) {
                // ASSERT
                expect(actual).toEqual(expected);
                done();
            });
        });
    });
});
