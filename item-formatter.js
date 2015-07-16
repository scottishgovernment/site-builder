// The item formatter is responsible for any formatting that needs to be done to the
// contentItems fetched from the ContentSource before being processes.
//
// Currently we assign a layout and group descendants for ORG_LIST's
//
module.exports = exports = function() {

    // Assign layout based on the format.
    //
    // For most formats this is done by making it lowercase, replacing -'s with _'s and then adding .hbs
    //
    // The exception to this is that category lists are assigne a differne layout depending on how deep in the
    // tree they are.
    function layout(item) {
        var format = item.contentItem._embedded.format.name.toLowerCase();
        var layout;
        if (format === 'category_list') {
            // we have category list layouts for depths 0 - 3.  If we are deeper
            // than that then default to 2
            if (item.ancestors.length < 4) {
                layout = 'category-list-' + item.ancestors.length + '.hbs';
            } else {
                layout = 'category-list-2.hbs';
            }
        } else {
            layout = format + '.hbs';
            layout = layout.replace(/_/g, '-');
        }
        return layout;
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