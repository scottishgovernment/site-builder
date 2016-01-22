module.exports = function (dir) {

    var redirects = [];

    var handlebars = require('handlebars');
    var fs = require('fs-extra');

    var templateText = fs.readFileSync(__dirname + '/redirects.hbs', 'UTF-8');
    var template = handlebars.compile(templateText);

    return {

        // called when the content source is starting
        start: function(callback) {
            redirects = [];

            // load any hard coded redirects
            if (fs.existsSync('resources/url_aliases.csv')) {
              var csv = require("fast-csv");
              console.log('Loading url_aliases.csv');
              csv.fromPath("resources/url_aliases.csv")
            	 .on("data", function(data){
                  var alias = {
                    url: data[1],
                    alias: data[0]
                  };
            	 	  redirects.push(alias);
            	 }).on("end", function() {
                  console.log('Loaded '+redirects.length+' redirects from url_aliases.csv');
          	 			callback();
            	 });
            } else {
              callback();
            }
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
