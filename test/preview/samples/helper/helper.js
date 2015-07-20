module.exports.register = function (Handlebars, options) {
    'use strict';
    Handlebars.registerHelper('nvl', function (object1, object2) {
        return object1 || object2;
    });
};


