'use strict';

/**
 * Handler for category lists
 *
 * Assigns a layout based on distance to content
 **/
var Format = require('./format');

class CategoryListFormat extends Format {


    /**
     * Assign a layout based on its depth in the site tree and how far it is
     * from non navigational content.
     **/
    layout(content) {
        // if this content only has one ancestor then use category-list-1, otherwise
        // determine by distance to the content
        if (content.ancestors.length === 1) {
            return 'category-list-1.hbs';
        }

        // determine the layout depoending on the distance to reach a non navigational content content
        switch (distanceToContent(content, 1)) {
            case 1:
                return 'jumpoff.hbs';
            case 2:
                return 'jumpoff-with-sub-categories.hbs';
            default:
                return assignCategoryLayoutBasedOnDepth(content);
        }
    }

    prepareForRender(context, content, callback) {

        // number children and grandchildren by index (this is used by the data-gtm attribs)
        var i = 0;
        var j = 0;
        content.descendants.forEach(function(child) {
            child.indexInParent = j;
            j++;
            child.descendants.forEach(function(grandChild) {
                grandChild.indexInGrandparent = i;
                i++;
            });
        });
        callback(null, content);
    }
}

function assignCategoryLayoutBasedOnDepth(content) {
    if (content.ancestors.length >= 3) {
        return 'category-list-2.hbs';
    } else {
        return 'category-list-' + content.ancestors.length + '.hbs';
    }
};

function distanceToContent(content, i) {

    // if there are no descendants then we do not know how far the content is
    if (content.descendants.length === 0) {
        return 100;
    }

    // if one of the children is a non-navigational content then we have found our
    // level
    for (var j = 0; j < content.descendants.length; j++) {
        if (!content.descendants[j].navigational) {
            return i;
        }
    }

    // calculate the distance from each child and then return th minimum distance
    var childDistances = [];
    content.descendants.forEach(function(descendant) {
        childDistances.push(distanceToContent(descendant, i + 1));
    });
    return Math.min.apply(null, childDistances);
};

module.exports = CategoryListFormat;
