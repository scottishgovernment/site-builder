// Code for formatting the 'Latest' page for policies.
// This code is shared between yaml-wirter and preview/content-source.
module.exports = exports = function() {

  function ancestorItem(item) {
    return {
      uuid: item.uuid,
      url: item.url,
      title: item.contentItem.title,
      summary: item.contentItem.summary
    };
  }

  return {
      formatLatest : function (item) {
        var latestItem = JSON.parse(JSON.stringify(item));
        latestItem.uuid = item.contentItem.uuid + '-latest';
        latestItem.contentItem.uuid = item.contentItem.uuid + '-latest';
        latestItem.contentItem._embedded.format._embedded.siteSearchable = false;
        latestItem.contentItem._embedded.parent = {
          uuid: item.contentItem.uuid,
          name: item.contentItem.title
        };
        latestItem.url = item.url + 'latest/';
        latestItem.title = 'Latest';
        latestItem.ancestors.push(ancestorItem(item));
        latestItem.layout = 'policy-latest.hbs';
        return latestItem;
      }
  };
};
