// ContentHandler that writes YAML files under a root directory
//
// The ContentSource will call the method of this object as it fetched the content.
module.exports = function(rootDir) {

    var fs = require('fs-extra');
    var yaml = require('js-yaml');

    var context = {
        funding: {
            businessTypes: [],
            fundingBusinessStages: [],
            fundingBusinessRegions: [],
            fundingBusinessSectors: [],
            fundingBusinessPurpose: [],
            fundingOpportunityType: []
        }
    };

    var writeYamlAndJson = function(item) {

        var yamlData = '~~~\n' + yaml.dump(item) + '~~~\n';
        yamlData = yamlData + item.contentItem.content;
        // write the YAML into a directory based upon its URL
        var dir = rootDir + item.url;
        fs.mkdirsSync(dir);

        var yamlFilename = dir + 'index.yaml';
        var jsonFilename = dir + 'index.json';

        fs.writeFileSync(yamlFilename, yamlData);
        fs.writeFileSync(jsonFilename, JSON.stringify(item, null, '\t'));

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

        CATEGORY_LIST : function (item) {
            // number grandchildren by index (this is used by the data-gtm attribs)
            var i = 0;
            item.descendants.forEach(function (child) {
                child.descendants.forEach(function (grandChild) {
                    grandChild.indexInGrandparent = i;
                    i++;
                });
            });

            writeYamlAndJson(item);
        },

        STRUCTURAL_CATEGORY_LIST: function() {
            // ignore structural category lists
        },

        FUNDING_OPPORTUNITY: function(item) {
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
        },

        FUNDING_LIST: function(item) {
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
        },

        GUIDE: function(item) {
            var html = require('marked')(item.contentItem.content);
            var $ = require('cheerio').load(html);
            var url = item.url;

            item.canonicalurl = url;
            item.url = url;
            writeYamlAndJson(item);

            $('h1').each(function(index, element) {
                var slug = $(element).text().toLowerCase().replace(/[^\w]+/g, '-');
                item.contentItem['guidepage'] = $(element).text();
                item.contentItem['guidepageslug'] = slug;
                item.url = url + slug + '/';
                if (index === 0) {
                    item.canonicalurl = url;
                } else {
                    item.canonicalurl = item.url;
                }
                writeYamlAndJson(item, slug);
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
            var customHandler = customHandlers[item.contentItem._embedded.format.name];
            if (customHandler) {
                customHandler(item);
                callback();
            } else {
                writeYamlAndJson(item);
                callback();
            }
        },

        // called when the content source will provide no more items
        end: function(err, callback) {
            if (context.funding.list) {
                writeYamlAndJson(context.funding.list);
            }
            callback(err);
        }
    };
};
