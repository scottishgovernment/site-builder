'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(grunt) {

    require('load-grunt-config')(grunt);
    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-istanbul');
    grunt.loadNpmTasks('grunt-sonar-runner');

    var tokenFile = path.join(process.env.HOME, '.sonar/token');
    var token;
    if (fs.existsSync(tokenFile)) {
        token = fs.readFileSync(tokenFile).toString().trim();
    }

    var createSonarConfiguration = function(mode) {
        var options = {
            sonar: {
                analysis: {
                    mode: mode
                },
                host: {
                    url: 'http://sonar.digital.gov.uk'
                },
                projectKey: "site-builder",
                projectName: "Site Builder",
                projectVersion: grunt.package.version,
                projectDescription: grunt.package.description,
                sources: [
                    'decommission',
                    'preview',
                    'publish',
                    'render',
                    'tasks'
                ].join(','),
                language: 'js',
                sourceEncoding: 'UTF-8',
                javascript: {
                    lcov: {
                        reportPath: 'out/coverage/lcov.info'
                    }
                }
            }
        };
        if (token) {
          options.sonar.login = token;
        }
        return options;
    };

    grunt.initConfig({

        copy: {
            test: {
                files: [
                    {
                        expand: true,
                        src: ['publish/*.hbs'],
                        dest: 'out/instrument/'
                    },
                    {
                        expand: true,
                        src: ['decommission/*.hbs'],
                        dest: 'out/instrument/'
                    },
                    {
                        expand: true,
                        src: ['preview/resources/**'],
                        dest: 'out/instrument/'
                    },
                    {
                        expand: true,
                        src: ['preview/*.txt'],
                        dest: 'out/instrument/'
                    }
                ],
            },
        },

        instrument: {
            files: [
                'publish/*.js',
                'decommission/*.js',
                'preview/*.js',
                'render/*.js',
                'tasks/*.js'
            ],
            options: {
                lazy: true,
                basePath: 'out/instrument'
            }
        },

        jasmine_node: {
            preview: {
                all: ['test'],
                src: '*.js',
                options: {
                    specs: 'test/*_spec.js',
                    helpers: 'test/*_helper.js',
                    forceExit: true,
                    extensions: 'js',
                    specNameMatcher: 'spec',
                    jUnit: {
                        report: false,
                        savePath: "out/reports/",
                        useDotNotation: true,
                        consolidate: true
                    }
                }
            }
        },

        storeCoverage: {
            options: {
                dir: 'out/coverage'
            }
        },

        makeReport: {
            src: 'out/coverage/*.json',
            options: {
                type: 'lcov',
                dir: 'out/coverage',
                print: 'detail'
            }
        },

        sonarRunner: {
            analysis: {
                options: createSonarConfiguration('publish')
            },
            preview: {
                options: createSonarConfiguration('issues')
            }
        }

    });

};
