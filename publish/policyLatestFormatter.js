// Code for formatting the 'Latest' page for policies.
// This code is shared between yaml-wirter and preview/content-source.
module.exports = exports = function() {

  function ancestorItem(item) {
    var anc = {};
    var props = ['uuid', 'url', 'title', 'sortBy', 'summary'];
    props.forEach(function (prop) { anc[prop] = item[prop]; });
    return anc;
  }

  return {
      formatLatest : function (item) {
        var latestItem = JSON.parse(JSON.stringify(item));
        latestItem.contentItem.uuid = item.contentItem.uuid + '-latest';
        latestItem.contentItem._embedded.parent = {
          uuid: item.contentItem.uuid,
          name: item.contentItem.title
        };
        latestItem.url = item.url + 'latest/';
        latestItem.title = 'Latest';
        latestItem.ancestors.push(ancestorItem(item));
        latestItem.layout = 'policy-latest.hbs';
      }
  };
};
