module.exports = function () {

    function mapResource(amphora, resource) {
        var pub = amphora.publication;
        var prop = resource.metadata.parentSlug;
        pub[prop] = pub[prop] || [];
        pub[prop].push(createSource(resource));
        pub[prop].sort(function (a, b) {
            return a.index - b.index;
        });
    }
  
    function createSource(resource) {
        var source = resource.metadata || {};
        source.path = resource.path;
        source.index = resource.ordinal;
        if (resource.storage) {
            source.details = resource.storage.metadata;
            source.url = source.namespace + source.filename;
        }  else {
            source.url = source.path;
        }
        return source;
    }

    return  {

        supports: function (resource) {
            return resource.metadata.required !== false 
                && resource.metadata.type !== 'publication-page-content' 
                &&  (resource.metadata.type === 'publication-page' 
                    || (resource._links.inline && resource.storage)); 
        }, 

        handle : function (amphora, resource, callback) {
            if (this.supports(resource)) {
                mapResource(amphora, resource);
            }
            callback();
        }
    };
};