module.exports = function (dir) {

    var redirects = [];

    var handlebars = require('assemble-handlebars');
    var fs = require('fs-extra');
    var f = fs.readFileSync(__dirname + '/redirects.hbs', 'UTF-8');
    var template;
    handlebars.compile(f, {}, function(ex, tmpl) {
        template = tmpl;
    });

    return {

        // called when the content source is starting
        start: function(callback) {
            redirects = [];
            callback();
        },

        // called for each content item provided by the content source
        handleContentItem: function(item, callback) {

            if (item.contentItem._embedded.urlaliases) {
                item.contentItem._embedded.urlaliases.forEach(
                    function(alias) {
                        var redirect = {
                            url: item.url,
                            alias: alias.url
                        };
                        redirects.push(redirect);
                    });
            }

            callback();
        },

        // called when the content source will provide no more items
        end: function(err, callback) {
            var formattedRedirects = template(redirects);
            fs.mkdirsSync(dir);
            fs.writeFileSync(dir+'/urlAliases.txt', formattedRedirects, 'UTF-8');
            callback();
        }
    };
};
