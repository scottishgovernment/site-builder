'use strict';

/**
 * Creates slugs for use in URLs or anchor tags for a given string.
 */
var slugify = require('slug');
slugify.defaults.mode ='mygovscot';
slugify.defaults.modes['mygovscot'] = {
    replacement: '-',
    symbols: true,
    remove: /[']/g,
    lower: true,
    charmap: slugify.charmap,
    multicharmap: slugify.multicharmap
};

module.exports = slugify;
