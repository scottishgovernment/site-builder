/**
 * Amphora Publication Page Formatter
 * This object is responsible for formatting publication page 
 * It will download publication-page-content (which is a page html)
 * and create aggregated json file
 **/
module.exports = function () {
    return {
    	handle : function (base, amphora, page, callback) {
    		var publication = amphora.publication;
    		publication[page.metadata.parentSlug] = publication[page.metadata.parentSlug] || [];
            var source = page.metadata.source;
            delete source.images;
            source.index  = page.ordinal;
            source.url = page.path;
            publication[page.metadata.parentSlug][page.ordinal] = source;
            callback();
        }
    };
};