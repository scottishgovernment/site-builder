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
      var context  = process.previewCache.context;
      var slug = key.replace(
        'out/pages', '').replace(
        'out/contentitems', '').replace(
        'index.json', '').replace(
        '.json', '');
      var res = request('GET', context.resolve(slug, context.visibility), context.auth);
      var item = context.formatter.format(JSON.parse(res.getBody('utf8')));
      item.body = item.contentItem.content;
      return JSON.stringify(item);
    };

    function store(key, value) {
      // store json only
      if (key.indexOf('.json') > 0 ) {
        cache[key] = {
          stored: new Date().getTime(), 
          data: value
        };
        return cache[key];
      }
    };
    
    return {

      mkdirsSync: function(key) {
        if (key.indexOf('out/') !== 0) {
          fs.mkdirsSync(key);
        }
      }, 

      writeFile: function (key, value, callback) {
        if (key.indexOf('out/') === 0) {
          store(key, value);
          callback();
        } else {
          fs.writeFile(key, value, callback);
        }
      },
       
      readFileSync: function(key) {
        if (key.indexOf('out/') === 0) {
          clean();
          var cacheItem =  cache[key] || cache[key.replace('-latest', '')];
          if (!cacheItem) {
            cacheItem = store(key, getContent(key));
          }
          return cacheItem.data;
        } else {
          return fs.readFileSync(key);
        }
      }, 
       
      writeFileSync: function(key, value) {
        if (key.indexOf('out/') === 0) {
          store(key, value);
        } else {
          fs.writeFileSync(key, value);
        }
      }
    };
};