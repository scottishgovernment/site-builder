var sutPath = '../../out/instrument/tasks/sonar-inspector';

var fs = require('fs');
var grunt = function() {
    var gruntTask = {};
    return {

        registerTask: function(taskName, description, task) {
            gruntTask[taskName] = {
                task: task,
                // this function is called by grunt task
                async: function() {
                    return function() {}
                },
            };
        },
        runTask: function(taskName) {
            gruntTask[taskName].task();
            gruntTask[taskName].result = 'success';
        },
        verify: function(taskName) {
            expect(gruntTask[taskName].result).toEqual('success');
        }

    }
};
// this test is more or less a dummy test
// Inspect task is not part of the build process, it is a flavour 
describe('Inpect (Grunt Task)', function() {

    it('run-grunt-task, empty report', function() {
        var g = grunt();
        var gruntTask = require(sutPath)(g);
        gruntTask.setFs(function() {
            return {
                readFileSync: function(reports) {
                    return JSON.stringify({
                        issues: []
                    })
                }
            }
        }());
        g.runTask('inspect');
        g.verify('inspect');
    });

    it('run-grunt-task, use reports', function() {
        var g = grunt();
        var gruntTask = require(sutPath)(g);
        gruntTask.setFs(function() {
            return {
                readFileSync: function(reports) {
                    return JSON.stringify({
                        issues: [{
                            line: 1,
                            severity: 'info',
                            message: 'notok'
                        }]
                    })
                }
            }
        }());
        g.runTask('inspect');
        g.verify('inspect');
    });

    it('run-grunt-task, with error', function() {
        var g = grunt();
        var gruntTask = require(sutPath)(g);
        gruntTask.setFs(function() {
            return {
                readFileSync: function(reports) {
                    throw new Error('can not find file' + reports);
                }
            }
        }());
        g.runTask('inspect');
        g.verify('inspect');
    });
});
