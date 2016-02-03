var renderPath = '../../out/instrument/render/render';
var sutPath = '../../out/instrument/publish/site';

describe('site', function() {

    var path = require('path');
    var resources = path.join(process.cwd(), 'test/render/site');

    it('site', function(done) {
        var render = require(renderPath);
        var layouts = path.join(resources, 'layouts');
        var partials = path.join(resources, 'partials');
        var helpers = path.join(resources, 'helpers');
        var renderer = new render.Renderer(layouts, partials, helpers);

        var items = path.join(resources, 'items');
        var out = path.join(process.cwd(), 'out/pages');
        var site = require(sutPath);
        var siteBuilder = new site.Site(items, out, renderer);
        siteBuilder.build(done);
    });

});
