var sutPath = '../../out/instrument/render/images';
var images = require(sutPath);

describe('images collector', function() {

    var collector;

    beforeEach(function() {
        collector = images.collector(function (img) { return img; });
    });

    it('collects internal links by id', function () {

        // ARRANGE
        var urls = [
            'http://www.gov.scot/images/small/square/nic.jpg',
            'http://www.gov.scot/images/small/square/nic.jpg',
            '/images/small/square/nic.jpg',
            'http://www.gov.scot/images/large/portrait/nic.jpg',
            '/pic.jpg'
        ];

        // turned into paths and the duplicates removed
        var expected = {
            '/images/small/square/nic.jpg' : '/images/small/square/nic.jpg',
            '/images/large/portrait/nic.jpg' : '/images/large/portrait/nic.jpg',
            '/pic.jpg' : '/pic.jpg'
        };

        // ACT
        urls.forEach(function (url) {
            collector(url);
        });

        // ASSERT
        expect(collector.urls).toEqual(expected);
    });

});
