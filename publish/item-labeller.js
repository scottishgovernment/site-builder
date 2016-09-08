'use strict';

/**
 * Assigns a 'label' for a content item based on its type.
 *
 * This label is for gov.scot formats and controle the label that apears in
 * search results and above the h1 in many formats.
 **/

 var labelMap = {};

 ['POLICY','POLICY_DETAIL', 'POLICY_LATEST'].forEach(function (format) {
     labelMap[format] = 'policy';
 });

 ['ROLE', 'FEATURED_ROLE', 'PERSON'].forEach(function (format) {
     labelMap[format] = 'role';
 });

 ['APS_PUBLICATION', 'publications-non-aps'].forEach(function (format) {
     labelMap[format] = 'publication';
 });

 labelMap['PRESS_RELEASE'] = 'news';

// decide what 'type' of labelling to use for this content item
function type(item) {
    var isNonAPSPublication
        = item.contentItem._embedded.format._embedded.category.id === 'publications-non-aps';
    if (isNonAPSPublication) {
        return 'non-aps-publication';
    }

    var isAPSPublication = item.contentItem._embedded.format.name === 'APS_PUBLICATION';
    if (isAPSPublication) {
        return 'aps-publication';
    }

    var formatName = item.contentItem._embedded.format.name;
    if (!labelMap[formatName]) {
        return 'unlabelled';
    }

    return 'standard';
}

function nonAPSPublicationParts(item) {
    var parts = [];
    parts.push(labelMap['publications-non-aps']);
    parts.push(item.contentItem._embedded.format.description);
    return parts;
}

function apsPublicationParts(item) {
    var parts = [];
    var publicationType = item.contentItem.publicationType;
    parts.push(labelMap['APS_PUBLICATION']);
    parts.push(publicationType);
    return parts;
}

module.exports = exports = function() {
    return {
        label : function (item) {

            var labelParts = [];

            switch (type(item)) {
                case 'aps-publication':
                    labelParts = apsPublicationParts(item);
                break;

                case 'non-aps-publication':
                    labelParts = nonAPSPublicationParts(item);
                break;

                case 'standard':
                    var formatName = item.contentItem._embedded.format.name;
                    labelParts = [labelMap[formatName]];
                break;
            }

            // make everything upper case
            labelParts = labelParts.map(function (part) {
                return part.toLowerCase();
            });

            // join the parts with a hyphen
            return labelParts.join(' - ');
        }
    };
};
