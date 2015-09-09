module.exports = function(grunt) {

    var cp = require('child_process'),
        path = require('path');

    function run(callback) {
        var bin = path.join(__dirname, '../preview/run.js');
        var proc = cp.spawn(bin, [], {stdio: 'inherit'});
        proc.on('close', function (code) {
            callback(callback);
        });
    }

    grunt.registerTask('preview', function() {
        run(this.async());
    });

};
