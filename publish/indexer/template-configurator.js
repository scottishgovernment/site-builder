'use strict';

/**
 * Contains logic configuring templates in elasticsearch.
 **/
var async = require('async');
var fs = require('fs');
var path = require('path');

/**
 * Used to register elasticsearch templates
 **/
class TemplateConfigurator {

    constructor(site, listener, esClient) {
        // this tenranry can be removed after the delivery of MGS-1824 for both sites.
        // until then this ensures that an older version of the site will work
        // with a new version of site-builder.
        this.templatesDir = site.getElasticSearchTemplatesDir ?
            site.getElasticSearchTemplatesDir() : undefined;
        this.listener = listener;
        this.esClient = esClient;
    }

    registerTemplates(callback) {
        if (!this.templatesDir) {
            this.listener.info('No search templates to register');
            callback();
            return;
        }

        fs.readdir(this.templatesDir, (err, files) => {
            if (err) {
                callback(err);
                return;
            }

            registerTemplateFiles(this.templatesDir,
                files.filter(file => path.extname(file) === '.mustache'),
                this.esClient, this.listener, callback);
        });
    }
}

function registerTemplateFiles(dir, files, esClient, listener, callback) {

    async.each(files,
        (file, cb) => {
            fs.readFile(path.resolve(dir, file), 'utf-8', (err, data) => {
                if (err) {
                    cb(err);
                    return;
                }
                var id = file.split('.')[0];
                var template = {
                    id: id,
                    body: {
                        template: data
                    }
                };
                esClient.putTemplate(template,
                    (error, response) => {
                        if (!error) {
                            listener.info('Registered template ' + id['cyan']);
                        } else {
                            listener.info('Failed to register template ' + id['red']);
                        }
                        cb(error, response);
                    });
            });
        }, callback);
}

module.exports = TemplateConfigurator;
