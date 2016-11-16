var sutPath = '../../../../out/instrument/publishing/format/_handlers/structural-category-list';
//var sutPath = '../../../../publishing/format/_handlers/site-item';

var sutClass = require(sutPath);
var sut = new sutClass;
describe('structural-category-list', function() {

    describe('prepareForRender', function() {

        function item(uuid, signpostUrl) {
            return {
                uuid: uuid
            }
        }

        it('store is false', function(done) {

            // ARRANGE
            var input = item('GOV-1');

            // ACT
            var context = {
                attributes: {
                    'GOV-1': {}
                }
            }
            sut.prepareForRender(context, input, function (err, actual) {
                // ASSERT
                expect(context.attributes['GOV-1'].store).toEqual(false);
                done();
            });
        });
    });
});
