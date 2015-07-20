var GwwwuntTask = require('../out/instrument/gwwwunt/lib/gwwwuntserver.js');
var grunt = require('grunt');

describe('Gwwwunt', function() {
    var mockGwwwunt
    var createMockTask
    var mockTask;

    /**
     * Helper method for creating a mock task.
     *
     * @param {Function} [done]
     * @returns {*}
     */
    createMockTask = function(done) {
        return {
            options: {},
            serve: {
                options: {
                    port: 7003,
                    yamlPath: '.grunt/aliases.yaml',
                    keepAlive: false
                }
            }
        };
    };

    beforeEach(function() {
        mockTask = createMockTask();
    });

	afterEach(function () {
		mockTask = null;
	});
	
    it('is defined', function() {
        expect(GwwwuntTask).toBeDefined();
    });
    it('has all required methods to run', function() {
        expect(GwwwuntTask.prototype.run).toBeDefined();
    });

});
