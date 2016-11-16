'use strict';

/**
 * Handler for structural category lists.  Set store to false to stop it being saved as
 * a page should not be generated for structural category lists.
 **/
var Format = require('./format');

class StructuralCategoryListFormat extends Format {

    prepareForRender(context, content, callback) {
        context.attributes[content.uuid].store = false;
        callback(null, content);
    }
}

module.exports = StructuralCategoryListFormat;
