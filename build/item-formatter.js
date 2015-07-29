// The item formatter is responsible for any formatting that needs to be done to the
// contentItems fetched from the ContentSource before being processes.
//
// Currently we assign a layout and group descendants for ORG_LIST's
//
module.exports = exports = function(layoutstrategy) {

    // Assign layout based on the format.
    //
    // For most formats this is done by making it lowercase, replacing -'s with _'s and then adding .hbs
    //
    // The exception to this is that category lists are assign a different layout 
    // depending on the 'layoutstrategy' passed in.  We currently have 
    // 2 strategies:
    //    depth: assigns a layout depending on how deep in the tree the item is.
    //    distanceToContent: descides on a 'jumpofpage' if we either 1 or 2 steps away form 'content'
    function layout(item) {
        var format = item.contentItem._embedded.format.name.toLowerCase();
        var layout;

        if (format === 'category_list') {
            // assign a layout 

            if (layoutstrategy === 'distanceToContent') {
                return assignCategoryLayoutBasedOnDistanceToContent(item);
            } else {
                return assignCategoryLayoutBasedOnDepth(item);
            }
        } else {
            layout = format + '.hbs';
            layout = layout.replace(/_/g, '-');
        }
        return layout;
    }

    function assignCategoryLayoutBasedOnDepth(item) {

        if (item.ancestors.length > 3) {
            return 'category-list-2.hbs';
        } else {
            return 'category-list-' + item.ancestors.length + '.hbs';
        }
    }

    function assignCategoryLayoutBasedOnDistanceToContent(item) {
        // determine the layout depoending on the distance to reach a non navigational content item
        switch (distanceToContent(item, 1)) {
            case 1: return 'jumpoff.hbs';
            case 2: return 'jumpoff-with-sub-categories.hbs';
            default: 
                return assignCategoryLayoutBasedOnDepth(item);
        }
    }

    function distanceToContent(item, i) {

        // if there are no descendants then we do not know how far the content is
        if (item.descendants.length === 0) {
            return 100;
        }

        // if one of the children is a non-navigational item then we have found our 
        // level
        for ( var j = 0; j < item.descendants.length; j++ ){
            if (!item.descendants[j].navigational) {
                return i;
            }
        }

        // calculate the distance vfrom each child and then return th minimum distance
        var childDistances = [];
        item.descendants.forEach(function (descendant) {
            childDistances.push(distanceToContent(descendant, i+1));
        });
        return Math.min.apply(null, childDistances);
    }

    // create an array containing descendants grouped by the first letter of their title
    function groupDescendantsByFirstLetter(item) {

        var groupedDescendants = {};
        item.descendants.forEach(function (descendant) {
            var lowercaseTitle = descendant.title.toLowerCase();
            var firstLetter = lowercaseTitle.charAt(0);
            if (!groupedDescendants[firstLetter]) {
                groupedDescendants[firstLetter] = {
                    letter: firstLetter,
                    items: []
                };
            }
            groupedDescendants[firstLetter].items.push(descendant);
        });

        // convert the object into an array
        item.descendantsByFirstLetter = [];
        for( var i in groupedDescendants ) {
            if (groupedDescendants.hasOwnProperty(i)){
               item.descendantsByFirstLetter.push(groupedDescendants[i]);
            }
        }
    }

    // create an array containing descendants grouped by sector
    function groupDescendantsBySector(item) {
        var groupedDescendants = {};
        item.descendants.forEach(function (descendant) {
            if (!groupedDescendants[descendant.sector]) {
                groupedDescendants[descendant.sector] = {
                    sector: descendant.sector,
                    sectorDescription: descendant.sectorDescription,
                    sectorCount: 0,
                    items: []
                };
            }
            groupedDescendants[descendant.sector].items.push(descendant);
            groupedDescendants[descendant.sector].sectorCount++;
        });

        // convert the object into an array
        item.descendantsBySector = [];
        for( var i in groupedDescendants ) {
            if (groupedDescendants.hasOwnProperty(i)){
                item.descendantsBySector.push(groupedDescendants[i]);
            }
        }
    }

    function sortLAServices(item) {
        item.descendants.sort(
            function (a, b) {
                if (a.serviceProvider > b.serviceProvider) {
                    return 1;
                }
                if (a.serviceProvider < b.serviceProvider) {
                    return -1;
                }
                return 0;
            });
    }

    function redactLinks(o) {
        delete o.links;
        for (var i in o) {
            if (o[i] !== null && typeof(o[i])==="object") {
                redactLinks(o[i]);
            }
        }
    }

    return {

        // perform any format specific transformations that are required
        format : function (item) {
            // assign a layout based up the format
            item.layout = layout(item);
console.log('layout '+item.layout);
            // redact any info we do not want
            redactLinks(item);

            // assign a page title (meta page title if set, title otherwise)
            item.pagetitle = item.contentItem.metapagetitle ? item.contentItem.metapagetitle : item.contentItem.title;
            if (item.pagetitle) {
                item.pagetitle = item.pagetitle.trim();
            }

            // do any format specific formatting
            if ('ORG_LIST' === item.contentItem._embedded.format.name) {
                groupDescendantsByFirstLetter(item);
                groupDescendantsBySector(item);
            }

            if ('LA_SERVICE_FINDER' === item.contentItem._embedded.format.name) {
                sortLAServices(item);
            }

            return item;
        }
    };
};