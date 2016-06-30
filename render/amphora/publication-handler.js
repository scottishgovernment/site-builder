module.exports = function () {
    return {

        supports: function (resource) {
            return resource.metadata.required !== false
                      && resource.metadata.type === 'publication';
        },

        handle : function (amphora, resource, callback) {
            if (this.supports(resource)) {
                amphora.publication = resource.metadata.source;
            }
            callback();
        }
    };
};