module.exports = function(dir) {

  var redirects = [];

  var handlebars = require('handlebars');
  var fs = require('fs-extra');

  var templateText = fs.readFileSync(__dirname + '/redirects.hbs', 'UTF-8');
  var template = handlebars.compile(templateText);

  function addRedirect(redirect) {
    if (!redirect.url || redirect.url.length === 0 || !redirect.alias || redirect.alias.length === 0) {
      console.log('skipping invalid redirect:', JSON.stringify(redirect));
      return;
    }

    // ensure that the alias has an optional trailing slash
    if (redirect.alias.charAt(redirect.length - 1) === '/') {
      redirect.alias = redirect.alias + '?';
    } else {
      redirect.alias = redirect.alias + '/?';
    }
    redirects.push(redirect);
  }

  return {

    // called when the content source is starting
    start: function(callback) {
      redirects = [];
      // load any hard coded redirects
      if (!fs.existsSync('resources/url_aliases.csv')) {
        callback();
        return;
      }

      console.log('Loading url_aliases.csv');
      require("fast-csv").fromPath("resources/url_aliases.csv")
        .on("data", function(data) {
          addRedirect({
            url: data[1],
            alias: data[0]
          });
        }).on("end", function() {
          console.log('Loaded ' + redirects.length + ' redirects from url_aliases.csv');
          callback();
        });
    },

    // called for each content item provided by the content source
    handleContentItem: function(item, callback) {

      if (item.contentItem._embedded.urlaliases) {
        item.contentItem._embedded.urlaliases.forEach(
          function(alias) {
            addRedirect({
              url: item.url,
              alias: alias.url
            });
          });
      }

      callback();
    },

    // called when the content source will provide no more items
    end: function(err, callback) {
      var formattedRedirects = template(redirects);
      fs.mkdirsSync(dir);
      fs.writeFileSync(dir + '/urlAliases.txt', formattedRedirects, 'UTF-8');
      callback();
    }
  };
};
