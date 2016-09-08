
'use strict';

/**
 * Filter used to decide which content items should be indexed.
 **/

module.exports = {
    accept : function (item) {
        // if this format is not site searchable then do not index it
        if (item.contentItem._embedded.format._embedded.siteSearchable !== true) {
            return false;
        }

        if (item.contentItem._embedded.format.name === 'PERSON') {
            if (item.inverseRelatedItems.hasIncumbent.length > 0) {
                return false;
            }
        }

        return true;
    }
};
