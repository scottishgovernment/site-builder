 'use strict';
 module.exports = function(grunt) {
     var name = 'gwwwunt';
     var description = 'Provides a web interface for your grunt tasks listed in a yaml file';
     grunt.registerMultiTask(name, description, function () {
         var GwwwuntTask = require(__dirname + '/../gwwwunt/lib/gwwwuntserver');
         var task = new GwwwuntTask(this);
         task.run();
     });
 }
