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
        reOrderDocuments(pub);
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

    function reOrderDocuments(pub) {
        title = pub.title.trim().replace(/\s+/g, ' ').split(' ');
        pub.documents.sort(function (a, b) {
            return wordCount(title, b) - wordCount(title, a);
        });
        pub.documents.sort(function (a, b) {
           return b.filename.lastIndexOf('.pdf') - a.filename.lastIndexOf('.pdf');
        });
    }

    function wordCount(title, document) {
        words = document.source.title.trim().replace(/\s+/g, ' ').split(' ');
        var wordCount = 0;
        words.forEach(function(source, i) {
            source === title[i] ? wordCount++ : wordCount--;
        });
        return wordCount;
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
	    		url: page.url,
                visible: page.title.toLowerCase() !== 'contents' 
                     && page.title.toLowerCase() !== 'table of contents'
	    	}
            pub.toc.push(tocItem);
	    });
        
        index = pub.toc[index].visible ? index : index + 1;
        // by default page zero is current page, if the first page is content page, it will be removed
	    // default content for the publication is first page as well.
        if (pub.toc[index]) { 
        	pub.toc[index].current = true;
            pub.publicationSubPage = {
	            content: pub.pages[index].content,
                title: pub.pages[index].title,
	    	    index: index,
	    	    prev: index === 0 ? null : index - 1,
	    	    next: index === pub.toc.length - 1 ?  null : index + 1  
	        }
        }
	}

    return {
    	cleanup : function (item, callback, currentPage) {
    		var pub = item.amphora.publication;
    		// delete images which is not required by hbs
    		delete pub.images;
            // move thumnails to their respective documents
            moveThumbnails(pub);
            // create table of contents
    		createToc(pub, currentPage);
            // create content for search index
            if (process.mode !== 'preview') {
                createHtmlContent(item, pub);
            }  
    		callback(null , item);
        }
    };
};
