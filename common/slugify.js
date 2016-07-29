'use strict';

/**
 * Creates slugs for use in URLs or anchor tags for a given string.
 */
var slugify = function slug(string) {

    return string
        // Make lower-case
        .toLowerCase()
        // Remove misc punctuation
        .replace(/['"’‘”“`]/g, '')
        // Replace non-word characters with dashes
        .replace(/[\W|_]+/g, '-')
        // Remove starting and trailing dashes
        .replace(/^-+|-+$/g, '');

};

module.exports = slugify;
