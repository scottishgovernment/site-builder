module.exports = exports = function(timeout, config) {
    
	var amphora = require('../render/amphora/amphora')(config, 'preview');
	var formatter = require('../render/amphora/formatter')();
    // 3 min
	var inactiveTimeout = 60 * timeout * 1000; 

	var cache = {};

	var reg = /publications\/(.*)?\/pages\/(.*)?\//;

    // clean up cache from inactive amphoras
	function clean (n) {
	    for (var cacheItem in cache) { 
	       if (n - cache[cacheItem].stored > inactiveTimeout) {
	       	    console.log('removed ' + cacheItem + ' from amphora cache');
	            delete cache[cacheItem];
	        }
	    }
    };
  
    return {
       
       // aps publication pages do not exist as content items in publishing platform
       // they can not be fetched using the url
       // if url matches publication page
       // page part is removed from url
    	getUrl : function(source) {
    		var aps = ((source + '/')).replace(/\/\//g, '/').match(reg);
            return aps ? '/publications/' + aps[1] + '/' : source;
    	},
         
        // return amphora from cache
        // update if inactive time interval timedout 
        update: function(req, item, callback) {
        	var n = new Date().getTime();
        	clean(n); 
        	var cacheItem = cache[item.url];
        	var aps = ((req.path + '/')).replace(/\/\//g, '/').match(reg);
            var currentPage = aps ? aps[2]: null;
        	if (!cacheItem  ||  n - cacheItem.stored > inactiveTimeout) { 
        		amphora.handleAmphoraContent(item, currentPage, function() {
        			if (item.amphora) {
        				cacheItem = {
        		    	    amphora: item.amphora,
        		    	    stored: n
        		        };
        		        cache[item.url] = cacheItem;
        			}
        		    callback();
        		});  
        	}  else if (cacheItem && cacheItem.amphora) {
        		item.amphora = JSON.parse(JSON.stringify(cacheItem.amphora));
            	formatter.cleanup(item, 'preview', currentPage, function() {
            		cacheItem.stored = n;
                    callback();
                });
        	} else {
            	callback();
            }
        }
    };
};
