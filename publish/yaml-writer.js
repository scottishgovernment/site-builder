// ContentHandler that writes YAML files under a root directory
//
// The ContentSource will call the method of this object as it fetched the content.
module.exports = function(rootDir) {

    var path = require('path');
    var fs = process.previewCache || require('fs-extra');
    var yaml = require('js-yaml');
    var slugify = require('../common/slugify');
    var config = require('config-weaver').config();
    var policyLatestFormatter = require('./policyLatestFormatter')();


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
            pressRelease: {},
            publications: {}
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

    var writeContentItem = function (item) {
        var yamlText = itemAsYaml(item);
        var jsonText = JSON.stringify(item, null, 4);
        var base = path.join(rootDir, item.contentItem.uuid);
        fs.writeFileSync(base + '.yaml', yamlText);
        fs.writeFileSync(base + '.json', jsonText);
    };

    var writeContentPage = function (item) {
        var yamlText = itemAsYaml(item);
        var jsonText = JSON.stringify(item, null, 4);
        var dir = path.join('out', 'pages', item.url);
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
        PERSON : function (item, callback) {

            // If this person has a listed role then only write this to
            // out/contentitems but not pages.
            if (item.contentItem.roleType === 'Listed') {
                writeContentItem(item);
            } else {
                writeYamlAndJson(item);
            }
            callback();
        },

        STRUCTURAL_CATEGORY_LIST : function (item, callback) {
          // do nothing, no yaml needs to be written
          callback();
        },

        SITE_ITEM : function (item, callback) {

          // only create the yaml if this is not being used as a signpost
          if (item.contentItem.signpostUrl === null) {
            writeYamlAndJson(item);
          }

          callback();
        },

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
            writeContentItem(item);
            writeContentPage(item);

            var url = item.url;
            var html = require('marked')(item.contentItem.content);
            var $ = require('cheerio').load(html);

            $('h1').each(function(index, element) {
                var slug = slugify($(element).text());
                item.contentItem['guidepage'] = $(element).text();
                item.contentItem['guidepageslug'] = slug;
                item.url = url + slug + '/';
                item.canonicalurl = !index ? url : item.url;
                writeContentPage(item);
            });

            item.canonicalurl = url;
            item.url = url;
            callback();
        },

        POLICY: function(item, callback) {
            if (config.policylatest.enabled !== true) {
              writeYamlAndJson(item);
              callback();
              return;
            }

            // now write the latest' page for this policy item
            var latestItem = policyLatestFormatter.formatLatest(item);
            writeYamlAndJson(latestItem);
            writeYamlAndJson(item);
            callback();
        },

        APS_PUBLICATION: function(item, callback) {
            var publicationDate = new Date(item.contentItem.publicationDate),
                compareDate;

            if (context.lists.publications.minDateTime) {
                compareDate = context.lists.publications.minDateTime;
            } else {
                compareDate = new Date();
            }

            if (publicationDate.getTime() < compareDate.getTime()) {
                context.lists.publications.minDateTime = new Date(item.contentItem.publicationDate);
            }

            writeYamlAndJson(item);

            if (!item.amphora) {
              callback();
              return;
            }

            var clone = JSON.parse(JSON.stringify(item));
            var pub = clone.amphora.publication;
            var pages = pub.pages;
            delete pub.pages;
            pages.forEach(function(page) {
                if (pub.toc[page.index].visible) {
                    // make the url page url so we can generate yaml corresponding the page namespace
                    clone.url  = page.url;
                    // update publication with the current page details (each page does it)
                    // all these iteration has to be synch otherwise new clone is required
                    var prev = null;
                    if (page.index !== 0 && pub.toc[page.index - 1].visible) {
                        prev = page.index - 1;
                    }
                    pub.publicationSubPage = {
                        content: page.content,
                        index: page.index,
                        title: page.title,
                        prev: prev,
                        next: page.index === pub.toc.length - 1 ? null : page.index + 1
                    };
                    if (pub.toc[page.index - 1]) {
                        delete pub.toc[page.index - 1].current;
                    }
                    pub.toc[page.index].current = true;
                    writeContentPage(clone);
                }
            });
            callback();
        },

        PUBLICATION_LANDING: function (item, callback) {
            item.contentItem.minDateTime = context.lists.publications.minDateTime;

            context.lists.publications.landing = item;

            callback();
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

            // 3. Publications landing
            if (context.lists.publications.landing) {
                writeYamlAndJson(context.lists.publications.landing);
            }
            callback(err);
        }
    };
};
