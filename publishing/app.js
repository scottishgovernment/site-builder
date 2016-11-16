'use strict';

var path = require('path');
var PrepareContext = require('./prepare-context');
var render = require('../render/render');
var renderer = new render.Renderer('resources/templates/_layouts',
    'resources/templates/_partials', path.join(process.cwd(), 'resources/_helpers'));

module.exports = function(config, site, preview) {

    return {
        config: config,
        preview: preview,
        site: site,
        renderer: renderer,
        amphora: require('./format/amphora'),
        prepare: require('./format/prepare-item')(site),
        contentSource: require('./content-source')(config, require('restler')),
        context: {
            errors: [],
            resourceQueue: [],
            lists: { pressRelease: {}, publications: {} }
        },
        createPrepareContext: function(visibility, token) {
            return new PrepareContext(this, visibility, token);
        }
    };
};