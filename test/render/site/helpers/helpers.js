'use strict';

module.exports.register = function (Handlebars, options) {

    Handlebars.registerHelper('bold', function(options) {
      return new Handlebars.SafeString('<b>' + options.fn(this) + '</b>');
    });

};
