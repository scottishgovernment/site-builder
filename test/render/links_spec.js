var sutPath = '../../out/instrument/render/links';
var links = require(sutPath);

describe('links collector', function() {

    var collector;

    beforeEach(function() {
        collector = links.collector();
    });

    it('collects internal links by id', function () {
        collector('MYGOV-1');
        collector('MYGOV-2');
        expect(collector.ids).toEqual([{uuid: 'MYGOV-1'}, {uuid: 'MYGOV-2'}]);
    });

    it('collects internal links by id', function () {
        collector('MYGOV-1');
        collector('MYGOV-2');
        expect(collector.ids).toEqual([{uuid: 'MYGOV-1'}, {uuid: 'MYGOV-2'}]);
    });

    it('does not collect external links', function () {
        collector('http://foo.bar/');
        expect(collector.ids).toEqual([]);
    });

    it('does not collect internal links by path', function () {
        collector('/benefits/');
        expect(collector.ids).toEqual([]);
    });

    it('does not collect email addresses', function () {
        collector('mailto:foo@example.com');
        expect(collector.ids).toEqual([]);
    });
});

describe('links rewriter', function() {

    it('rewrites internal links', function (done) {
        var index = {
            'MYGOV-1': '/',
            'MYGOV-2': '/benefits/'
        }
        var rewriter = links.createRewriter(index);
        expect(rewriter('MYGOV-1')).toEqual('/');
        expect(rewriter('MYGOV-2')).toEqual('/benefits/');
        done();
    });

    it('adds a trailing slash if required', function (done) {
        var index = {
            'MYGOV-3': '/guide/'
        }
        var rewriter = links.createRewriter(index);
        expect(rewriter('MYGOV-3#anchor')).toEqual('/guide/#anchor');
        expect(rewriter('MYGOV-3/#anchor')).toEqual('/guide/#anchor');
        expect(rewriter('MYGOV-3/section')).toEqual('/guide/section/');
        expect(rewriter('MYGOV-3/section/')).toEqual('/guide/section/');
        expect(rewriter('MYGOV-3/section#anchor')).toEqual('/guide/section/#anchor');
        done();
    });

    it('does not modify external links', function (done) {
        var index = {
            'MYGOV-1': '/',
        }
        var rewriter = links.createRewriter(index);
        expect(rewriter('http://www.gov.scot/page')).toEqual('http://www.gov.scot/page');
        expect(rewriter('mailto:foo@example.com')).toEqual('mailto:foo@example.com');
        done();
    });

});
