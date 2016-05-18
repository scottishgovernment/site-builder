/**
 * Amphora Formatter
 * Moves thumbnails into specific document
 * Create table of contents
 * Create pages 
 * Delete details no longer required
 **/
module.exports = function () {

	var path = require('path');
    var fs = require('fs-extra');
    var yaml = require('js-yaml');

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

	function createPages(target, item) {
        var pub = item.amphora.publication;
        var pages = pub.pages;
        delete pub.pages;
		pages.forEach(function(page) {
			// make the url page url so we can generate yaml corresping the page namespace
			item.url  = page.url;
			// update publication with the current page details (each page does it)
			// all these iteration has to be synch otherwise new clone is required
			pub.publicationSubPage = {
				content: page.content,
	    		index: page.index,
	    		prev: page.index === 0 ? null : page.index - 1,
	    		next: page.index + 1
			};
			if (pub.toc[page.index-1]) {
				delete pub.toc[page.index-1].current;
			}
			pub.toc[page.index].current = true;
			// create yaml and other required objects for handlebars
		    createPageObjects(page, item);
		});
	}

    function createPageObjects(page, item) {
    	// create yaml, json and fragment (for debuging purposes)
        var dir = path.join('out', 'pages', page.url);
        fs.mkdirsSync(dir);
        var jsonText = JSON.stringify(item, null, 4);
        fs.writeFileSync(path.join(dir, 'index.yaml'), '~~~\n' + yaml.dump(item)  + '~~~\n');
        fs.writeFileSync(path.join(dir, 'index.json'), jsonText )
        fs.writeFileSync(path.join(dir, 'page.html.fragment'), page.content);
    }

    function createHtmlContent(item, pub) {
        item.contentItem.htmlContent = pub.pages.reduce(
            function (prev, page) { return prev + ' ' + page.content; },
        '');
    }

	function createToc(pub) {
		pub.toc = [];
		pub.pages = pub.pages || [];
		// iterate pages and create a tocItem from respective page (amphora resource) details
	    pub.pages.forEach(function(page) {
	    	var tocItem = {
	    		name: page.shortTitle,
	    		url:page.url,
	    	}
	    	pub.toc.push(tocItem);
	    });

	    // by default page zero is current page 
	    // default content for the publication is first page as well.
        if (pub.toc[0]) {
        	pub.toc[0].current = true;
            pub.publicationSubPage = {
	            content: pub.pages[0].content,
	    	    index: 0,
	    	    prev: null,
	    	    next: 1
	        }
        }
  	    
	}

    return {
    	cleanup : function (target, item, callback) {
    		var pub = item.amphora.publication;
    		// delete images which is not required by hbs
    		delete pub.images;
            // move thumnails to their respective documents
            moveThumbnails(pub);
            // create table of contents
    		createToc(pub);
            // clone content item to create publication page yamls from
            var clone = JSON.parse(JSON.stringify(item))
            // create yaml and json per page using the clone
            createPages(target, clone);
            // return to amphora
            // create content for search index
            createHtmlContent(item, pub);
    		callback();
        }
    };
};
