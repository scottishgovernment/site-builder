/**
 * Amphora Publication Formatter
 * This object is responsible for formatting publication content with TOC
 * setting current page 
 **/
module.exports = function () {

    return {
    	handle : function (base, amphora, publication, mode, callback) {
    		// amphora is the context shared by all the handlers during execution per content item
    		// other handlers might manupulate this context
    		amphora.publication = publication.metadata.source;
    		callback();
        }
    };
};
