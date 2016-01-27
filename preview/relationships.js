var path = require('path');

var idRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

function Relationships(renderer) {
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

        items = items.concat(collectLinks(item));

        // remove any we have already seen
        items = items.filter(function (rel) {
            return !seen[rel.uuid];
        });
    }
    return items;
}

function collectLinks(item) {
    var layouts = './resources/templates/_layouts/';
    var partials = './resources/templates/_partials/';
    var helpers = path.join(process.cwd(), 'resources/_helpers');
    var render = require('../render/render');
    var renderer = new render.Renderer(layouts, partials, helpers);
    var ids = [];
    renderer.rewriteLink = function(href) {
        var match = href.match(idRegex);
        if (match) {
            var id = match[0];
            ids.push({uuid: id});
        }
    };
    renderer.render(item);
    return ids;
}

module.exports = {
    Relationships: Relationships
}
