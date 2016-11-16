'use strict';

/**
 * Handler for site-item format.
 *
 * A page for a site item does not need to be generated it it has a signpost url.
 * This handler sets the 'storeItem' sttribute to suppr4ess the generation of a
 * yaml file.
 **/
var Format = require('./format');

class SiteItemFormat extends Format {

    prepareForRender(context, content, callback) {
        context.attributes[content.uuid].store = (content.contentItem.signpostUrl === null);
        callback(null, content);
    }
}

module.exports = SiteItemFormat;
