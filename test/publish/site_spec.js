var renderPath = '../../out/instrument/render/render';
var sutPath = '../../out/instrument/publish/site';

describe('the site build', function() {

    var path = require('path');
    var fs = require('fs');
    var resources = path.join(process.cwd(), 'test/render/site');

    function sampleCachableItems() {
        return [
            { id: 'SITE-01', hash: '1hash', uuid: '/01/' },
            { id: 'SITE-02', hash: '2hash', uuid: '/02/' },
            { id: 'structural', hash: 'structural', uuid: '/structural/' },
        ];
    }

    fs.writeFileSync(path.join(resources, 'items', '/siteIndex.json'), JSON.stringify(sampleCachableItems()));


    it('generates pages', function(done) {
        var render = require(renderPath);
        var layouts = path.join(resources, 'layouts');
        var partials = path.join(resources, 'partials');
        var helpers = path.join(resources, 'helpers');
        var renderer = new render.Renderer(layouts, partials, helpers);

        var items = path.join(resources, 'items');
        var out = path.join(process.cwd(), 'out/pages');
        var site = require(sutPath);
        var siteBuilder = new site.Site(items, renderer);
        siteBuilder.build(function(err) {
            if (err) {
                return done('build failed: ' + err);
            }
            fs.stat(path.join(items, 'pages/01/index.html'), function(err, data) {
                if (err) {
                    return done('output file not generated: ' + err);
                }
                done();
            });
        });
    });

    it('rewrites internal links', function(done) {
        var items = path.join(resources, 'items');
        fs.readFile(path.join(items, 'pages/02/index.html'), function(err, data) {
            if (err) {
                return done(err);
            }
            expect(data.toString()).toMatch('<p>hello <a href="/01/">home</a></p>');
            done();
        });
    });

});