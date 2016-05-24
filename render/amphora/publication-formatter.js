/**
 * Amphora Formatter
 * Moves thumbnails into specific document
 * Create table of contents
 * Create pages 
 * Delete details no longer required
 **/
module.exports = function () {

	function moveThumbnails(pub) {
        pub.documents = pub.documents || [];
        pub.thumbnails = pub.thumbnails || [];
        // find respective document using _createdFor metadata
		pub.thumbnails.forEach(function(thumb) {
            pub.documents.forEach(function(doc) {
            	if (thumb._createdFor === doc.path) {
            		doc.thumbnails = doc.thumbnails || {};
            		doc.thumbnails[thumb.thumbnailSize] = thumb.url;
            	}
            });
		});
        delete pub.thumbnails;
	}

    function createHtmlContent(item, pub) {
        item.contentItem.htmlContent = pub.pages.reduce(
            function (prev, page) { return prev + ' ' + page.content; },
        '');
    }

	function createToc(pub, currentPage) {
        var index = parseInt(currentPage || 0);
		pub.toc = [];
		pub.pages = pub.pages || [];
		// iterate pages and create a tocItem from respective page (amphora resource) details
	    pub.pages.forEach(function(page) {
	    	var tocItem = {
	    		title: page.title || page.source.shortTitle,
	    		url: page.url
	    	}
	    	pub.toc.push(tocItem);
	    });
	    // by default page zero is current page 
	    // default content for the publication is first page as well.
        if (pub.toc[index]) {
        	pub.toc[index].current = true;
            pub.publicationSubPage = {
	            content: pub.pages[index].content,
	    	    index: index,
	    	    prev: index === 0 ? null : index - 1,
	    	    next: index === pub.toc.length - 1 ?  null : index + 1  
	        }
        }
	}

    return {
    	cleanup : function (item, mode, callback, currentPage) {
    		var pub = item.amphora.publication;
    		// delete images which is not required by hbs
    		delete pub.images;
            // move thumnails to their respective documents
            moveThumbnails(pub);
            // create table of contents
    		createToc(pub, currentPage);
            // create content for search index
            if (mode !== 'preview') {
                createHtmlContent(item, pub);
            }  
    		callback(null , item);
        }
    };
};
