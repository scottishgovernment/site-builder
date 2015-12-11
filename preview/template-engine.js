module.exports = function() {

    var render = require('../render/render');

    function init(layouts, partials, helpers) {
      render.init(layouts, partials, helpers);
      render.handlebars.registerPartial('clickjack', '');
    }

    return {

        render: function(item, callback) {
            try {
                var html = render.render(item);
                callback(null, html);
            } catch (ex) {
                callback(ex, {message: "Unable to render content", status: 400});
            }
        },

        compile: init

    };
};
