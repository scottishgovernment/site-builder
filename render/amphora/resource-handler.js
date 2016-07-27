module.exports = function () {

    function getParentSlug(resource) {
        var paths = resource.path.split('/');
        return paths[paths.length - 3];
    }

    function mapResource(amphora, resource) {
        var pub = amphora.publication;
        var prop = getParentSlug(resource);
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
            if (!source.title || !source.title.trim()) {
                source.title = source.filename;
            }
        }  else {
            source.url = source.path;
        }
        return source;
    }

    return  {

       
        supports: function (resource) {
            if (resource.metadata.required === false) {
                return false;
            }
            var downloadable = resource._links.inline && resource.storage;
            var page = resource.metadata.type === 'publication-page';
            return page || downloadable;
        },

        handle : function (amphora, resource, callback) {
            if (this.supports(resource)) {
                mapResource(amphora, resource);
            }
            callback();
        }
    };
};
