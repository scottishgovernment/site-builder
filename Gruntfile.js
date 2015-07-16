'use strict';

module.exports = function(grunt) {

    require('load-grunt-config')(grunt);
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-jasmine-node');
    grunt.loadNpmTasks('grunt-istanbul');

    grunt.initConfig({

        copy: {
            test: {
                files: [
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
            files: ['item-formatter.js', 'preview/*.js'],
            options: {
                lazy: true,
                basePath: 'out/instrument'
            }
        },

        jasmine_node: {
            preview: {
                all: ['test/preview'],
                src: 'src/preview/*.js',
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
        }

    });

};
