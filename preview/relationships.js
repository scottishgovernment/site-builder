var path = require('path');
var links = require('../render/links');

function Relationships(renderer) {
    this.renderer = renderer;
}

Relationships.prototype.find = function (item) {
    var items = [];
    var seen = {};
    seen[item.uuid] = item;
    if (item.relatedItems) {
        items = items.concat(item.relatedItems.hasResponsibleDirectorate);
        items = items.concat(item.relatedItems.hasSecondaryResponsibleDirectorate);
        items = items.concat(item.relatedItems.hasResponsibleRole);
        items = items.concat(item.relatedItems.hasSecondaryResponsibleRole);
        items = items.concat(item.relatedItems.hasIncumbent);
        items = items.concat(item.relatedItems.hasOrganisationalRole);
        items = items.concat(item.relatedItems.hasSecondaryOrganisationalRole);
        items = items.concat(item.inverseRelatedItems.hasIncumbent);

        // if this is a policy then ensure that the policy details pages are available
        if (item.layout === 'policy.hbs') {
          items = items.concat(
            item.descendants.map(function (d) { return { url: d.url}; })
          );
        }

        // policy detail pages need their parent
        if (item.layout === 'policy-detail.hbs') {
            items = items.concat(item.relatedItems.hasParent);
        }
    }

    items = items.concat(this.collectLinks(item));
    items = items.filter(function (rel) {
        return !seen[rel.uuid];
    });
    return items;
}

Relationships.prototype.collectLinks = function (item) {
    var collector = links.collector();
    var context = {
        rewriteLink: collector
    };
    this.renderer.render(item, context);
    return collector.ids;
}

module.exports = {
    Relationships: Relationships
}
