var sutPath = '../../out/instrument/publish/items';
//var sutPath = '../../publish/items';

describe('items', function() {
    var temp = require('temp');
    var tempDir;
    var fs = require('fs');

    beforeEach(function(done) {
        temp.mkdir('test',
            function(err, dirPath) {
                tempDir = dirPath;
                console.log(tempDir);
                done();
            }
        );
    });

    function appContext(items) {
        var byId = {};
        items.forEach(item => byId[item.id] = item);
        return {
            createPrepareContext: function (visibility) {
                return {
                    fetchItem : function (path, callback) {
                        console.log('fetchItem:' + path);
                        callback(null, byId[path]);
                    }
                }
            },

            contentSource : {
                fetchCachableItems : function (headers, visibility, callback) {
                    callback(null, items);
                }
            }
        }
    }

    function mockContentHandler() {
        return  {
            items: {},
            deletedItems: {},

            start: function(cb) {
                cb();
            },
            end: function(err, cb) {
                console.log('end');
                cb();
            },
            handleContentItem: function(context, content, cb) {
                this.items[content.uuid] = true;
                cb(null, content);
            },
            removeContentItem: function(context, id, cb) {
                this.deletedItems[id] = true;
                cb(null, id);
            }
        }
    }

    function sampleCachableItems() {
        return [
            { id: 'GOV-1', hash: 'GOV-1hash', uuid:'GOV-1'},
            { id: 'GOV-2', hash: 'GOV-2hash', uuid:'GOV-2'},
            { id: 'GOV-3', hash: 'GOV-3hash', uuid:'GOV-3'},
        ] ;
    }

    it('index file written, no index file at start', function(done) {

        // ARRANGE
        var contentHandler = mockContentHandler();
        var sut = require(sutPath)(tempDir, appContext(sampleCachableItems()), contentHandler);

        // ACT
        sut.generate(function() {

            // ASSERT
            var siteIndex = JSON.parse(fs.readFileSync(tempDir + '/siteIndex.json'));
            expect(siteIndex.length).toBe(sampleCachableItems().length);
            done();
        });
    });

    it('overwrites existing index file', function(done) {

        // ARRANGE
        var contentHandler = mockContentHandler();
        var sut = require(sutPath)(tempDir, appContext(sampleCachableItems()), contentHandler);

        // write an index file - this should be overwritten
        fs.writeFileSync(tempDir + '/siteIndex.json', JSON.stringify(sampleCachableItems()));

        // ACT
        sut.generate(function() {

            // ASSERT
            var siteIndex = JSON.parse(fs.readFileSync(tempDir + '/siteIndex.json'));
            expect(siteIndex.length).toBe(sampleCachableItems().length);
            done();
        });
    });

    it('items deleted when gone from index', function(done) {

        // ARRANGE
        var contentHandler = mockContentHandler();
        // write an index file - this should be overwritten
        var items = sampleCachableItems();
        fs.writeFileSync(tempDir + '/siteIndex.json', JSON.stringify(items));
        var removed = items.shift();
        var sut = require(sutPath)(tempDir, appContext(items), contentHandler);

        // ACT
        sut.generate(function() {

            // ASSERT
            var siteIndex = JSON.parse(fs.readFileSync(tempDir + '/siteIndex.json'));
            var expectedRemoved = [removed.uuid];
            expect(contentHandler.deletedItems[removed.id]).toEqual(true);
            done();
        });

    });

    it('new item', function(done) {

        // ARRANGE
        var contentHandler = mockContentHandler();
        // write an index file - this should be overwritten
        var items = sampleCachableItems();
        fs.writeFileSync(tempDir + '/siteIndex.json', JSON.stringify(items));
        items.push({id:'new', uuid:'new', hash:'newhash'});

        var sut = require(sutPath)(tempDir, appContext(items), contentHandler);

        // ACT
        sut.generate(function() {

            // ASSERT
            var siteIndex = JSON.parse(fs.readFileSync(tempDir + '/siteIndex.json'));
            expect(contentHandler.items['new']).toEqual(true);
            done();
        });

    });

    it('changed item', function(done) {

        // ARRANGE
        var contentHandler = mockContentHandler();
        // write an index file - this should be overwritten
        var items = sampleCachableItems();
        fs.writeFileSync(tempDir + '/siteIndex.json', JSON.stringify(items));
        items = items.map(item => { item.hash = item.hash + 'changed'; return item});
        var sut = require(sutPath)(tempDir, appContext(items), contentHandler);

        // ACT
        sut.generate(function() {

            // ASSERT
            var siteIndex = JSON.parse(fs.readFileSync(tempDir + '/siteIndex.json'));
            items.forEach(item => expect(contentHandler.items[item.id]).toEqual(true));
            done();
        });

    });
});
