var renderPath = '../../out/instrument/render/render';
var sutPath = '../../out/instrument/publish/site';

describe('the site build', function() {

    var path = require('path');
    var fs = require('fs');
    var resources = path.join(process.cwd(), 'test/render/site');


    it('generates pages', function(done) {
        var render = require(renderPath);
        var layouts = path.join(resources, 'layouts');
        var partials = path.join(resources, 'partials');
        var helpers = path.join(resources, 'helpers');
        var renderer = new render.Renderer(layouts, partials, helpers);

        var items = path.join(resources, 'items');
        var out = path.join(process.cwd(), 'out/pages');
        var site = require(sutPath);
        var siteBuilder = new site.Site(items, out, renderer);
        siteBuilder.build(function(err) {
            if (err) {
                return done('build failed: ' + err);
            }
            fs.stat('out/pages/01/index.html', function (err, data) {
                if (err) {
                    return done('output file not generated: ' + err);
                }
                done();
            });
        });
    });

    it('rewrites internal links', function(done) {
        fs.readFile('out/pages/02/index.html', function (err, data) {
            if (err) {
                return done(err);
            }
            expect(data.toString()).toMatch('<p>hello <a href="/01/">home</a></p>');
            done();
        });
    });

});
