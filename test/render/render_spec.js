var sutPath = '../../out/instrument/render/render';
describe('render', function() {

    var path = require('path');
    var resources = path.join(process.cwd(), 'test/render/site');

    it('Render', function(done) {
        var render = require(sutPath)
        var layouts = path.join(resources, 'layouts');
        var partials = path.join(resources, 'partials');
        var helpers = path.join(resources, 'helpers');
        var renderer = new render.Renderer(layouts, partials, helpers);
        var html = renderer.render({
            layout: 'layout.hbs',
            content: 'hello'
        });
        expect(html).toContain("<p>hello</p>");
        done();
    });

    it('Render shortcodes', function(done) {
        var render = require(sutPath)
        var layouts = path.join(resources, 'layouts');
        var partials = path.join(resources, 'partials');
        var helpers = path.join(resources, 'helpers');
        var renderer = new render.Renderer(layouts, partials, helpers);
        var html = renderer.render({
            layout: 'shortcode.hbs'
        });
        expect(html).toContain("<p><b>hello</b></p>");
        done();
    });

});
