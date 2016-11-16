var sutPath = '../../../../out/instrument/publishing/format/_handlers/site-item';
//var sutPath = '../../../../publishing/format/_handlers/site-item';

var sutClass = require(sutPath);
var sut = new sutClass;
describe('site-item', function() {

    describe('prepareForRender', function() {

        function itemWithSignpost(uuid, signpostUrl) {
            return {
                uuid: uuid,
                contentItem: {
                    signpostUrl: signpostUrl
                }
            }
        }

        it('store attrib set if no signpost', function(done) {

            // ARRANGE
            var input = itemWithSignpost('GOV-1', null);

            // ACT
            var context = {
                attributes: {
                    'GOV-1': {}
                }
            }
            sut.prepareForRender(context, input, function (err, actual) {
                // ASSERT
                expect(context.attributes['GOV-1'].store).toEqual(true);
                done();
            });
        });

        it('store attrib not set if signpost', function(done) {

            // ARRANGE
            var input = itemWithSignpost('GOV-1', 'http://www.google.com/');

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
