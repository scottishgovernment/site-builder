// ContentHandler that writes YAML files under a root directory
//
// The ContentSource will call the method of this object as it fetched the content.
module.exports = function(rootDir) {

    var path = require('path');
    var fs = require('fs-extra');
    var yaml = require('js-yaml');
    var slugify = require('./slugify');
    var config = require('config-weaver').config();
    var restler = require('restler');
    var http = require('http');
    var async = require('async');

    var context = {
        funding: {
            businessTypes: [],
            fundingBusinessStages: [],
            fundingBusinessRegions: [],
            fundingBusinessSectors: [],
            fundingBusinessPurpose: [],
            fundingOpportunityType: []
        },

        lists: {
            pressRelease: {}
        }
    };

    var itemAsYaml = function (item) {
        return '~~~\n'
            + yaml.dump(item)
            + '~~~\n'
            + item.contentItem.content;
    };

    var writeYamlAndJson = function (item) {

        var yamlText = itemAsYaml(item);
        var jsonText = JSON.stringify(item, null, 4);
        var base = path.join(rootDir, item.contentItem.uuid);
        fs.writeFileSync(base + '.yaml', yamlText);
        fs.writeFileSync(base + '.json', jsonText);

        var dir = path.join('out', 'pages', item.url);
        fs.mkdirsSync(dir);
        fs.writeFileSync(path.join(dir, 'index.yaml'), yamlText);
        fs.writeFileSync(path.join(dir, 'index.json'), jsonText);

    };

    var writeGuideItem = function (item) {
        var yamlText = itemAsYaml(item);
        var jsonText = JSON.stringify(item, null, 4);
        var base = path.join(rootDir, item.contentItem.uuid);
        fs.writeFileSync(base + '.yaml', yamlText);
        fs.writeFileSync(base + '.json', jsonText);
    };

    var writeGuidePage = function (item) {
        var yamlText = itemAsYaml(item);
        var jsonText = JSON.stringify(item, null, 4);
        var dir = path.join('out/pages', item.url);
        fs.mkdirsSync(dir);
        fs.writeFileSync(path.join(dir, 'index.yaml'), yamlText);
        fs.writeFileSync(path.join(dir, 'index.json'), jsonText);
    };

    var addElement = function(array, element, property) {
        if (element) {
            if (Array.isArray(element)) {
                element.forEach(function(child) {
                    addElement(array, child, property);
                });
                return;
            }
            var val = (property ? element[property] : element);

            for (var i = 0; i < array.length; i++) {
                if (array[i] === val) {
                    return;
                }
            }
            array.push(val);
            array.sort();
        }
    };

    var customHandlers = {

        CATEGORY_LIST : function (item, callback) {
            // number grandchildren by index (this is used by the data-gtm attribs)

            var i = 0,
                j = 0;

            item.descendants.forEach(function (child) {
                child.indexInParent = j;
                j++;

                child.descendants.forEach(function (grandChild) {
                    grandChild.indexInGrandparent = i;
                    i++;
                });
            });

            writeYamlAndJson(item);

            callback();
        },

        FUNDING_OPPORTUNITY: function(item, callback) {
            item.contentItem.fundingBusinessRegions = [];
            item.contentItem.businessTypes = [];
            addElement(item.contentItem.fundingBusinessRegions, item.contentItem._embedded.regions, 'name');
            addElement(item.contentItem.businessTypes, item.contentItem._embedded.businesstypes, 'name');
            // update context
            addElement(context.funding.businessTypes, item.contentItem._embedded.businesstypes, 'name');
            addElement(context.funding.fundingBusinessRegions, item.contentItem._embedded.regions, 'name');
            addElement(context.funding.fundingBusinessStages, item.contentItem.fundingBusinessStage);
            addElement(context.funding.fundingBusinessSectors, item.contentItem.fundingBusinessSectors);
            addElement(context.funding.fundingBusinessPurpose, item.contentItem.fundingBusinessPurpose);
            addElement(context.funding.fundingOpportunityType, item.contentItem.fundingOpportunityType);

            writeYamlAndJson(item);

            callback();
        },

        PRESS_RELEASE: function (item, callback) {
            var pressReleaseDateTime = new Date(item.contentItem.pressReleaseDateTime),
                compareDate;

            if (context.lists.pressRelease.minDateTime) {
                compareDate = context.lists.pressRelease.minDateTime;
            } else {
                compareDate = new Date();
            }

            if (pressReleaseDateTime.getTime() < compareDate.getTime()) {
                context.lists.pressRelease.minDateTime = new Date(item.contentItem.pressReleaseDateTime);
            }

            writeYamlAndJson(item);

            callback();
        },

        PRESS_RELEASE_LANDING_PAGE: function (item, callback) {
            item.contentItem.minDateTime = context.lists.pressRelease.minDateTime;

            context.lists.pressRelease.landing = item;

            callback();
        },

        FUNDING_LIST: function(item, callback) {
            // enrich funding list for the rhs dropdown menu items
            item.contentItem.businessTypes = context.funding.businessTypes;
            item.contentItem.fundingBusinessStages = context.funding.fundingBusinessStages;
            item.contentItem.fundingBusinessRegions = context.funding.fundingBusinessRegions;
            item.contentItem.fundingBusinessSectors = context.funding.fundingBusinessSectors;
            item.contentItem.fundingBusinessPurpose = context.funding.fundingBusinessPurpose;
            item.contentItem.fundingOpportunityType = context.funding.fundingOpportunityType;
            // update context
            context.funding.list = item;
            // do not yamlize this item yet, above lists will be updated while each funding_opportunity being handled.
            callback();
        },

        GUIDE: function(item, callback) {
            writeGuideItem(item);
            writeGuidePage(item);

            var url = item.url;
            var html = require('marked')(item.contentItem.content);
            var $ = require('cheerio').load(html);

            $('h1').each(function(index, element) {
                //var slug = $(element).text().toLowerCase().replace(/[^\w|\']+/g, '-');
                var slug = slugify($(element).text());
                item.contentItem['guidepage'] = $(element).text();
                item.contentItem['guidepageslug'] = slug;
                item.url = url + slug + '/';
                item.canonicalurl = !index ? url : item.url;
                writeGuidePage(item);
            });

            item.canonicalurl = url;
            item.url = url;
            callback();
        },

		PDF_COVER_PAGE: function(item, callback) {

			//go get meta data
			jsonurl = config.doctor.url+item.contentItem.pdfUUID;

			//somthing with restler to get the json
			restler
	            .get(jsonurl)
	                .on("complete", function(data, response) {
	                    if (data instanceof Error || response.statusCode !== 200) {
                            console.log("Unable to fetch the json for "+jsonurl);
                            console.log(JSON.stringify(data, null, '\t'));
                            callback(error);
	                    } else {

	                    	item.contentItem.pageCount=data.pages;
	                    	item.contentItem.size=data.size;

                			writeYamlAndJson(item);

                			// save jpg and pdf to dist
                            async.each(
                                data.binaries,
                                function(binary, cb){
                                    var filename = path.join( "out", "pages", item.url, path.basename(binary));
                                    var file = fs.createWriteStream(filename);
                                    http.get(config.doctor.url+binary, function(response) {
                                        response.pipe(file);
                                        response.on('end', cb);
                                    });
                                },
                                function(){
                                    callback();
                                });
	                    }
	                });

		}
    };

    return {

        // called when the content source is starting
        start: function(callback) {
            // clean out the directory
            fs.removeSync(rootDir);
            fs.mkdirsSync(rootDir);
            callback();
        },

        // called for each content item provided by the content source
        handleContentItem: function(item, callback) {
            // set the canonical url
            item.canonicalurl = item.url;

            var customHandler = customHandlers[item.contentItem._embedded.format.name];
            if (customHandler) {
                customHandler(item, callback);
            } else {
                writeYamlAndJson(item);
                callback();
            }


        },

        // called when the content source will provide no more items
        end: function(err, callback) {
            // special cases:
            // 1. Funding list
            if (context.funding.list) {
                writeYamlAndJson(context.funding.list);
            }

            // 2. Press release landing
            if (context.lists.pressRelease.landing) {
                writeYamlAndJson(context.lists.pressRelease.landing);
            }
            callback(err);
        }
    };
};
