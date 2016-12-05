'use strict';

/**
 * Base class for all formats.
 **/
class Format {

    constructor() {}

    validRequest(context, content) {
        if (context.app.preview) {
            var requestedPath = context.attributes[content.uuid].path;
            return requestedPath === '/' + content.uuid ||
                requestedPath === content.uuid ||
                requestedPath === content.url
        } else {
            return true;
        }
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
        if (this.validRequest(context, contentItem)) {
            callback(null, contentItem);
        } else {
            callback({ statusCode: 404, message: context.attributes[contentItem.uuid].path });
        }
    }
}

module.exports = Format;
