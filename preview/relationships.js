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

    items = items.filter(function (rel) {
        return !seen[rel.uuid];
    });
    return items;
};

Relationships.prototype.collectLinks = function (item) {
    var collector = links.collector();
    var context = {
        rewriteLink: collector
    };
    try {
      this.renderer.render(item, context);
    } catch (e) {
      console.log('Failed to render while collecting links');
      console.log(e.stack);
    }
    return collector.ids;
};

module.exports = {
    Relationships: Relationships
};
