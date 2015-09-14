var sutPath = '../../out/instrument/publish/content-source';

xdescribe('content-source', function() {

    var exampleItems = [
        {
            uuid: 'root-uuid',
            url: '/root',
            contentItem : {
                title: 'root',
                summary: 'root',
                layout: 'category-list'
            },
            ancestors: [],
            descendants: []
        },
        {
            uuid: 'home-uuid',
            url: '/',
            contentItem : {
                title: 'home',
                summary: 'homepage',
                layout: 'category-list'
            },
            ancestors: [],
            descendants: []
        }
    ];

    // formatter that does nothing
    var nullFormatter = {
        format : function(item) {
            return item;
        }
    }

    // formatter that throws an exception
    var exceptionThrowingFormatter = {
        format : function(item) {
            throw 'Unable to format item';
        }
    }

    it('green path', function(done) {
        // ARRANGE
        var server = require('./test-repo-server')(exampleItems).startServer(1112);
        var config = { buildapi: { endpoint: 'http://localhost:1112/' } };
        var contentHandler =  {
                start : function(callback) { callback(); },
                handleContentItem: function (contentItem, callback) { callback(); },
                end : function(error) { 
                    server.close(); 

                    // ASSERT
                    expect(contentHandler.start).toHaveBeenCalled();
                    expect(contentHandler.handleContentItem).toHaveBeenCalledWith(exampleItems[0], jasmine.any(Function));
                    expect(contentHandler.handleContentItem).toHaveBeenCalledWith(exampleItems[1], jasmine.any(Function));
                    expect(nullFormatter.format).toHaveBeenCalledWith(exampleItems[0]);
                    expect(nullFormatter.format).toHaveBeenCalledWith(exampleItems[1]);
                    expect(contentHandler.end).toHaveBeenCalled();
                    done();
                }
            };

        spyOn(contentHandler, 'start').andCallThrough();
        spyOn(contentHandler, 'handleContentItem').andCallThrough();
        spyOn(contentHandler, 'end').andCallThrough();
        spyOn(nullFormatter, 'format').andCallThrough();

        
        var sut = require(sutPath)(config, '', nullFormatter, contentHandler);

        //ACT
        sut.getContent();
    });

    it('server not running', function(done) {
        // ARRANGE
        //var server = require('./test-repo-server')(exampleItems).startServer(1111);
        var config = { buildapi: { endpoint: 'http://localhost:1112/' } };
        var contentHandler =  {
                start : function(callback) { callback(); },
                handleContentItem: function (contentItem, callback) { callback(); },
                end : function(error, status) { 
                    // ASSERT
                    expect(contentHandler.start).toHaveBeenCalled();
                    expect(contentHandler.end).toHaveBeenCalledWith({
                        code : 'ECONNREFUSED', 
                        errno : 'ECONNREFUSED', 
                        syscall : 'connect' 
                    });
                    done();
                }
            };

        spyOn(contentHandler, 'start').andCallThrough();
        spyOn(contentHandler, 'handleContentItem').andCallThrough();
        spyOn(contentHandler, 'end').andCallThrough();

        var sut = require(sutPath)(config, '', nullFormatter, contentHandler);

        //ACT
        sut.getContent();
    });

    it('404 gettings ids', function(done) {
        // ARRANGE
        var server = require('./test-repo-server')(exampleItems).start404ForItemServer(1112);
        var config = { buildapi: { endpoint: 'http://localhost:1112/' } };
        var contentHandler =  {
                start : function(callback) { callback(); },
                handleContentItem: function (contentItem, callback) { callback(); },
                end : function(error) { 
                    server.close(); 

                    // ASSERT
                    expect(contentHandler.start).toHaveBeenCalled();
                    expect(contentHandler.end).toHaveBeenCalledWith('404');
                    done();
                }
            };

        spyOn(contentHandler, 'start').andCallThrough();
        spyOn(contentHandler, 'handleContentItem').andCallThrough();
        spyOn(contentHandler, 'end').andCallThrough();

        // var sut = require('../../test/coverage/instrument/tasks/content-source')(config, restler, contentHandler());
        var sut = require(sutPath)(config, '', nullFormatter, contentHandler);

        //ACT
        sut.getContent();
    });

    it('404 getting one of the items', function(done) {
        // ARRANGE
        var server = require('./test-repo-server')(exampleItems).start404ForItemServer(1112);
        var config = { buildapi: { endpoint: 'http://localhost:1112/' } };
        var contentHandler =  {
                start : function(callback) { callback(); },
                handleContentItem: function (contentItem, callback) { callback(); },
                end : function(error) { 
                    server.close(); 

                    // ASSERT
                    expect(contentHandler.start).toHaveBeenCalled();
                    expect(contentHandler.end).toHaveBeenCalledWith('404');
                    done();
                }
            };

        spyOn(contentHandler, 'start').andCallThrough();
        spyOn(contentHandler, 'handleContentItem').andCallThrough();;
        spyOn(contentHandler, 'end').andCallThrough();

        // var sut = require('../../test/coverage/instrument/tasks/content-source')(config, restler, contentHandler());
        var sut = require(sutPath)(config, '', nullFormatter, contentHandler);

        //ACT
        sut.getContent();
    });

    it('badly formed JSON getting ids', function(done) {
        // ARRANGE
        var server = require('./test-repo-server')(exampleItems).startBadlyFormedJSONForIDsServer(1112);
        var config = { buildapi: { endpoint: 'http://localhost:1112/' } };
        var contentHandler =  {
                start : function(callback) { callback(); },
                handleContentItem: function (contentItem, callback) { callback(); },
                end : function(error) { 
                    server.close(); 

                    // ASSERT
                    expect(contentHandler.start).toHaveBeenCalled();
                    expect(contentHandler.end).toHaveBeenCalledWith(jasmine.any(Error));
                    done();
                }
            };

        spyOn(contentHandler, 'start').andCallThrough();
        spyOn(contentHandler, 'handleContentItem').andCallThrough();
        spyOn(contentHandler, 'end').andCallThrough();

        // var sut = require('../../test/coverage/instrument/tasks/content-source')(config, restler, contentHandler());
        var sut = require(sutPath)(config, '', nullFormatter, contentHandler);

        //ACT
        sut.getContent();
    });

    it('badly formed JSON getting item', function(done) {
        // ARRANGE
        var server = require('./test-repo-server')(exampleItems).startBadlyFormedJSONForItemServer(1112);
        var config = { buildapi: { endpoint: 'http://localhost:1112/' } };
        var contentHandler =  {
                start : function(callback) { callback(); },
                handleContentItem: function (contentItem, callback) { callback(); },
                end : function(error) { 
                    server.close(); 

                    // ASSERT
                    expect(contentHandler.start).toHaveBeenCalled();
                    expect(contentHandler.end).toHaveBeenCalledWith(jasmine.any(Error));
                    done();
                }
            };

        spyOn(contentHandler, 'start').andCallThrough();;
        spyOn(contentHandler, 'handleContentItem').andCallThrough();;
        spyOn(contentHandler, 'end').andCallThrough();

        var sut = require(sutPath)(config, '', nullFormatter, contentHandler);

        //ACT
        sut.getContent();
    });

    it('formatter throws exception', function(done) {
        // ARRANGE
        var server = require('./test-repo-server')(exampleItems).startBadlyFormedJSONForItemServer(1112);
        var config = { buildapi: { endpoint: 'http://localhost:1112/' } };
        var contentHandler =  {
                start : function(callback) { callback(); },
                handleContentItem: function (contentItem, callback) { callback(); },
                end : function(error) { 
                    server.close(); 

                    // ASSERT
                    expect(contentHandler.start).toHaveBeenCalled();
                    expect(contentHandler.end).toHaveBeenCalledWith(jasmine.any(Error));
                    done();
                }
            };

        spyOn(contentHandler, 'start').andCallThrough();
        spyOn(contentHandler, 'handleContentItem').andCallThrough();
        spyOn(contentHandler, 'end').andCallThrough();

        var sut = require(sutPath)(config, '', exceptionThrowingFormatter, contentHandler);

        //ACT
        sut.getContent();
    });


});
