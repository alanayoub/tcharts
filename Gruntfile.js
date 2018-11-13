/**
 * @module Gruntfile
 */
module.exports = function (grunt) {
    'use strict';
    //
    // Load all Grunt tasks
    // @see {@link https://github.com/sindresorhus/load-grunt-tasks|load-grunt-tasks}
    //
    require('load-grunt-tasks')(grunt);
    //
    grunt.config.init({
        pkg: grunt.file.readJSON('package.json'),
        /**
         * Clean directories
         * @see {@link https://github.com/gruntjs/grunt-contrib-clean|grunt-contrib-clean}
         * @example grunt clean
         */
        clean: ['dist/**/*'],
        /**
         * Copies files and directories to /dist.
         * @see {@link https://github.com/gruntjs/grunt-contrib-copy|grunt-contrib-copy}
         * @example copy:dist
         */
        copy: {
            dist: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: ['src/bar.js'],
                    cwd: '',
                    dest: 'dist/',
                    filter: 'isFile'
                }]
            }
        },
        /**
         *
         */
        uglify: {
            options: {
                compress: {
                    drop_console: true
                },
                mangle: false
            },
            dist: {
                files: {
                    'dist/tcharts.min.js': [
                        'vendor/raphael.fittext.js',
                        'src/index.js',
                        'src/_axes.js',
                        'src/_defaults.js',
                        'src/_label.js'
                    ]
                }
            }
        },
        /**
         * Build JSDocs
         * @see {@link https://github.com/krampstudio/grunt-jsdochttps://github.com/krampstudio/grunt-jsdoc|grunt-jsdoc}
         */
        jsdoc: {
            dist: {
                src: [],
                options: {
                    destination: 'web/jsdoc',
                    configure: 'jsdoc.json'
                }
            }
        },
        /**
         * Configure jshint
         * @see {@link https://github.com/gruntjs/grunt-contrib-jshint|grunt-contrib-jshint}
         */
        jshint: {
            options: {
                jshintrc: '.jshintrc',
            },
            all: [
                'Gruntfile.js',
                'src/**/*.js'
            ]
        }
    });
    grunt.registerTask('build', '', function () {
        grunt.config.set('env', 'dev');
        grunt.task.run([
            'clean',
            'jshint',
            'copy',
            'uglify'
        ]);
    });
};
