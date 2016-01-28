module.exports = function() {

    var renderer;

    function init(layouts, partials, helpers) {
        var render = require('../render/render');
        renderer = new render.Renderer(layouts, partials, helpers);
        renderer.handlebars.registerPartial('clickjack', '');
    }

    return {

        render: function(item, callback) {
            try {
                var html = renderer.render(item);
                callback(null, html);
            } catch (ex) {
                callback(ex, {message: "Unable to render content", status: 400});
            }
        },

        compile: init,

        get: function () {
            return renderer;
        }

    };
};
