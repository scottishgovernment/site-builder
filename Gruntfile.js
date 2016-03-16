'use strict';

module.exports = function(grunt) {

    require('load-grunt-config')(grunt);
    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-istanbul');
    grunt.loadNpmTasks('grunt-sonar-runner');

    var createSonarConfiguration = function(mode) {
        return {
            debug: true,
            sonar: {
                analysis: {
                    mode: mode
                },
                host: {
                    url: 'http://sonar.digital.gov.uk'
                },
                jdbc: {
                    url: 'jdbc:postgresql://sonar.digital.gov.uk/sonar',
                },
                projectKey: "site-builder",
                projectName: "Site Builder",
                projectVersion: grunt.package.version,
                projectDescription: grunt.package.description,
                sources: [
                    'decommission',
                    'gwwwunt',
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
                'gwwwunt/**/*.js',
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
                options: createSonarConfiguration('preview')
            }
        }

    });

};
