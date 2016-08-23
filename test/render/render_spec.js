var sutPath = '../../out/instrument/render/render';
describe('render', function() {

    var path = require('path');
    var resources = path.join(process.cwd(), 'test/render/site');

    var renderer;
    beforeEach(function() {
        var render = require(sutPath)
        var layouts = path.join(resources, 'layouts');
        var partials = path.join(resources, 'partials');
        var helpers = path.join(resources, 'helpers');
        renderer = new render.Renderer(layouts, partials, helpers);
    });

    it('Render', function() {
        var html = renderer.render({
            layout: 'layout.hbs',
            content: 'hello'
        });
        expect(html).toContain("<p>hello</p>");
    });

    it('Render shortcodes', function() {
        var html = renderer.render({
            layout: 'shortcode.hbs'
        });
        expect(html).toContain("<p><b>hello</b></p>");
    });

    it('Render img', function() {
        var html = renderer.render({
            layout: 'layout.hbs',
            content: '{{#img src="/images/smallsquarenic.jpg"}}{{/img}}'
        });
        expect(html).toContain('<img src="/images/smallsquarenic.jpg"/>');
    });


});
