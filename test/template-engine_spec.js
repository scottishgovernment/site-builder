var sutPath = '../out/instrument/preview/template-engine';
describe('template-engine', function() {
    var helpers = __dirname + '/samples/helper/';
    var layouts = __dirname + '/samples/layout/';
    var partials = __dirname + '/samples/partial/';

    it('Can render with helpers and partials', function(done) {
        var sut = require(sutPath)();
        sut.compile(layouts, partials, helpers);

        var item = {
            optiona: 'world',
            layout: 'layout.hbs',
            body: 'markdown'
        }
        sut.render(item, function(error, result) {
            expect("hello world").toEqual(result);
            done();
        });
    });

    it('Can use helpers', function(done) {
        var sut = require(sutPath)();
        sut.compile(layouts, partials, helpers);
        var item = {
            optiona: null,
            optionb: 'new world',
            layout: 'layout.hbs',
            body: 'markdown'
        }
        sut.render(item,  function(error, result) {
            expect("hello new world").toEqual(result);
            done();
        });
    });

    it('Can render without layout', function(done) {
        var sut = require(sutPath)();
        sut.compile(layouts, partials, helpers);
        var item = {
            optiona: 'unknown',
            body: 'markdown'
        }
        sut.render(item, function(error, result) {
            expect(result).toBeDefined();
            done();
        });
    });
});
