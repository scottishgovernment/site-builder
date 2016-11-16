'use strict';

/**
 * Base class for all formats.
 **/
class Format {

    constructor() {
    }

    /**
     * Determine the layotu to use for this format
     **/
    layout(content) {
        // most content item types map directly onto a hbs file:
        // turn the name into lowercase with - for spaces and then add .hsb
        // to the end.
        var formatName = content.contentItem._embedded.format.name;
        var type = formatName.toLowerCase().replace(/_/g, '-');
        return type + '.hbs';
    }

    /**
     * Prepare this content item for rendering
     **/
    prepareForRender(context, contentItem, callback) {
        callback(null, contentItem);
    }
}

module.exports = Format;
