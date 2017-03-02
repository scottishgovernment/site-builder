var renderPath = '../../out/instrument/render/render';
var sutPath = '../../out/instrument/publish/site';

describe('the site build', function() {

    var path = require('path');
    var fs = require('fs-extra');
    var resources = path.join(process.cwd(), 'test/render/site');
    var out = path.join(process.cwd(), 'out');

    function sampleCachableItems() {
        return [
            { id: 'SITE-01', hash: '1hash', url: '/01/' },
            { id: 'SITE-02', hash: '2hash', url: '/02/' },
            { id: 'structural', hash: 'structural', url: '/structural/' },
        ];
    }
    try {
        fs.unlinkSync(path.join(out, 'pages', '01', 'index.html'));
        fs.unlinkSync(path.join(out, 'pages', '02', 'index.html'));
    } catch (err) {

    }

    fs.copySync(path.join(resources, 'items'), out);

    fs.writeFileSync(path.join(out, 'siteIndex.json'), JSON.stringify(sampleCachableItems()));

    it('generates pages', function(done) {
        var render = require(renderPath);
        var layouts = path.join(resources, 'layouts');
        var partials = path.join(resources, 'partials');
        var helpers = path.join(resources, 'helpers');
        var renderer = new render.Renderer(layouts, partials, helpers);
        var site = require(sutPath);
        var siteBuilder = new site.Site(out, renderer);
        siteBuilder.build(function(err) {
            if (err) {
                return done('build failed: ' + err);
            }
            fs.stat(path.join(out, 'pages/01/index.html'), function(err, data) {
                if (err) {
                    return done('output file not generated: ' + err);
                }
                done();
            });
        });
    });

    it('rewrites internal links', function(done) {
        fs.readFile(path.join(out, 'pages/02/index.html'), function(err, data) {
            if (err) {
                return done(err);
            }
            expect(data.toString()).toMatch('<p>hello <a href="/01/">home</a></p>');
            done();
        });
    });

});
