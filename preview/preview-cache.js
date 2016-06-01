module.exports = exports = function() {

    var fs = require('fs');

    var timeout = 60000;
    var request = require('sync-request');

    var cache = {};

    function clean () {
      for (var key in cache) { 
        if (key !== 'out/referenceData.json' 
          && new Date().getTime() - cache[key].stored > timeout) {
          delete cache[key];
        }
      }
    };

    function getContent(key) {
      var slug = key.replace(
        'out/pages', '').replace(
        'out/contentitems', '').replace(
        'index.json', '').replace(
        '.json', '');
      var context = process.previewContext;
      var res = request('GET', context.resolve(slug, context.visibility));
      var item = context.formatter.format(JSON.parse(res.getBody('utf8')));
      item.body = item.contentItem.content;
      // TODO handle postprocess synchronously
      return JSON.stringify(item);
    };

    function store(key, value) {
      cache[key] = {
        stored: new Date().getTime(), 
        data: value
      };
    };
    
    return {

      mkdirsSync: function(key) {
        // no op
      }, 

      writeFile: function (key, value, callback) {
        store(key, value);
        callback();
      },
       
      readFileSync: function(key) {
        clean();
        var cacheItem =  cache[key];
        if (!cacheItem) {
          store(key, getContent(key));
        }
        return cache[key].data;
      }, 
       
      writeFileSync: function(key, value) {
        store(key, value);
      }
    };
};
