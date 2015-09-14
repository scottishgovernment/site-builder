module.exports = exports = function() {
    var items = [{
        title: 't',
        id: 'i',
        content: 'c',
        url:'/p1/'
    }, {
        title: 't2',
        id: 'i2',
        content: 'c2',
        url:'/p2/'
    }];
    return {
        fs: function() {
            var callStack = [];
            return {
                verify: function() {
                    var f = {
                        func: arguments[0],
                        args: arguments,
                        cally: {
                            verified: false
                        }
                    };
                    callStack.forEach(function(cally) {
                        if (!cally.verified && cally.func === f.func) {
                            var test = true;
                            for (var i = 1; i < f.args.length; i++) {
                                test = test && cally.args[i - 1] === f.args[i];
                            }
                            if (test) {
                                cally.verified = true;
                                f.cally = cally;
                            }
                        }
                    });
                    expect(f.cally.verified).toBe(true);
                },
                removeSync: function(dir) {
                    callStack.push({
                        func: 'removeSync',
                        args: arguments
                    });
                },
                mkdirsSync: function(dir) {
                    callStack.push({
                        func: 'mkdirsSync',
                        args: arguments
                    });
                },
                writeFile: function(filename, content, callback) {
                    callStack.push({
                        func: 'writeFile',
                        args: arguments
                    });
                    // TODO create doThrow logic
                    if (filename === '.ignore/invalid/index.yaml') {
                        callback('invalid filename');
                    } else {
                        callback();
                    }
                }
            }
        },

        grunt: function() {
            var gruntTask = {};
            return {

                registerTask: function(taskName, description, task) {
                    gruntTask[taskName] = {
                        task: task,
                        // this function is called by grunt task
                        async: function() {
                            return function() {}
                        }
                    };
                },
                runTask: function(taskName) {
                    gruntTask[taskName].task();
                },

                fail : {
                    fatal : function () {
                    },
                    warn : function () {
                    }
                }

            }
        },

        restler: function() {
            var fail = false;
            return {
                doFailOnce: function() {
                    fail = true;
                },
                get: function(url) {
                    return {
                        on: function(event, callback) {
                            if (fail) {
                                fail = false;
                                callback(new Error('Connection refused'));
                            } else {
                                if (event === 'complete') {
                                    if (url === '/content-sets/') {
                                        callback({
                                            'active-set': 'my-aset'
                                        });
                                    } else if (url === '/content-sets/my-aset') {
                                        callback(items);
                                    }
                                }
                            }

                        }
                    }
                }
            }
        },
        items: items
    };
};
