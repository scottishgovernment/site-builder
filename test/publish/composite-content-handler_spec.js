var sutPath = '../../out/instrument/publish/composite-content-handler';

describe('composite-content-handler', function() {

    it('propogates events as expected', function(done) {

        // ARRANGE
        var handler1 = {
            start: function(callback) {
                callback();
            },
            handleContentItem: function(item, callback) {
                callback();
            },
            end: function(err, callback) { callback(); }
        };
        var handler2 = {
            start: function(callback) {
                callback()
            },
            handleContentItem: function(item, callback) {
                callback();
            },
            end: function(err, callback) { callback(); }
        };

        var sut = require(sutPath)([handler1, handler2]);
        var item = {
            name: 'dummyitem'
        };
        var startcb = {
            callback: function() {}
        };
        var handlecb = {
            callback: function() {}
        };
        spyOn(handler1, 'start').andCallThrough();
        spyOn(handler1, 'handleContentItem').andCallThrough();
        spyOn(handler1, 'end').andCallThrough();
        spyOn(handler2, 'start').andCallThrough();
        spyOn(handler2, 'handleContentItem').andCallThrough();
        spyOn(handler2, 'end').andCallThrough();
        spyOn(startcb, 'callback').andCallThrough();
        spyOn(handlecb, 'callback').andCallThrough();

        // ACT
        sut.start(startcb.callback);
        sut.handleContentItem(item, handlecb.callback);
        sut.end(null, function() {
            // ASSERT
            expect(handler1.start).toHaveBeenCalledWith(jasmine.any(Function));
            expect(handler1.handleContentItem).toHaveBeenCalledWith(item, jasmine.any(Function));
            expect(handler1.end).toHaveBeenCalled();
            expect(startcb.callback).toHaveBeenCalled();
            expect(handlecb.callback).toHaveBeenCalled();
            done();
        });
    });
});
