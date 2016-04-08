module.exports = exports = function(config, target) {

    var restler = require('restler');
    var path = require('path');
    var fs = require('fs-extra');
    var http = require('http');
    var async = require('async');

    return {
        // for a content item, fetch meta data from doctor and write out any pdf and jpg files
        formatDoctorFiles: function(item, parentCallback) {

            item.documents = item.contentItem._embedded.documents;
            if (!item.documents || item.documents.length == 0) {
                // content item does not have any document references
                parentCallback();
                return;
            }
            // item now has list of documents [MGS-1099]
            // download content and dooctor details for each document
            async.each(item.documents, function(document, documentsCallback) {
                    var doctorUrl = config.doctor.url + document.externalDocumentId;
                    restler.get(doctorUrl).on('complete', function(data, response) {
                        if (data instanceof Error || response.statusCode !== 200) {
                            console.log("Unable to fetch the json for " + doctorUrl);
                            console.log(JSON.stringify(data, null, '\t'));
                            parentCallback(data);
                        } else {
                            // add doctor fields to the document
                            document.doctor = {};
                            document.doctor.pageCount = data.pageCount;
                            document.doctor.size = data.size;
                            document.doctor.lastUpdated = data.lastUpdated;
      
                            // MGS-1099 for backwards compatibility with the hbs file
                            // keeping these fields, setting to the first document..
                            if (document.uuid === item.documents[0].uuid) {
                                item.doctor = {};
                                item.doctor.pageCount = data.pageCount;
                                item.doctor.size = data.size;
                                item.doctor.lastUpdated = data.lastUpdated;
                            }

                            var dir = path.join('out', target, item.url);
                            fs.ensureDirSync(dir);
                            // copy file from doctor
                            async.each(data.binaries, function(binary, fileCallback) {
                               var filename = path.join(dir, path.basename(binary));
                                if (filename.endsWith('.pdf')) {
                                    document.doctor.filename = path.join(item.url, path.basename(binary));
                                    // MGS-1099 for backwards compatibility with the hbs file
                                    if (document.uuid === item.documents[0].uuid) {
                                      item.doctor.filename = document.doctor.filename;
                                    }
                                }
                                var stream = fs.createWriteStream(filename);
                                http.get(config.doctor.url + binary, function(response) {
                                    response.pipe(stream);
                                    response.on('end', fileCallback);
                                });
                            }, function(err) {
                                documentsCallback(err, document);
                            });
                        }
                    });
                },
                function(err) {
                    parentCallback(err, item);
                }
            );

        }
    };
};