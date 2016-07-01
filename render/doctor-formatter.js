module.exports = exports = function(config, target) {

    var restler = require('restler');
    var path = require('path');
    var fs = require('fs-extra');
    var http = require('http');
    var async = require('async');

    var thumbnailWidths = [107, 165, 214, 330];

    function writeDocument(dir, item, document, callback) {
      var filename = path.join(dir, path.basename(document.doctor.originalName));
      var stream = fs.createWriteStream(filename);
      var doctorURL = config.doctor.url + document.doctor.uuid + '/document';
      http.get(doctorURL, function(response) {
          response.pipe(stream);
          response.on('end', callback);
      });
    }

    function writeThumbnail(width, dir, item, document, callback) {
      var filename = path.join(dir,
        path.basename(document.doctor.originalName, path.extname(document.doctor.originalName))
        + '.' + width + '.jpg');
      var stream = fs.createWriteStream(filename);
      var doctorURL = config.doctor.url + document.doctor.uuid + '/thumbnail/' + width;
      http.get(doctorURL, function(response) {
          response.pipe(stream);
          response.on('end', callback);
      });
    }

    function writeThumbnails(dir, item, document, callback) {
      async.each(thumbnailWidths,
        function (width, cb) {
          writeThumbnail(width, dir, item, document, cb);
        },
        callback
      );
    }

    return {
        // for a content item, fetch meta data from doctor and write out any pdf and jpg files
        formatDoctorFiles: function(item, parentCallback) {
            item.documents = item.contentItem._embedded.documents;
            if (!item.documents || item.documents.length === 0) {
                // content item does not have any document references
                parentCallback();
                return;
            }

            async.each(item.documents,

              function(document, documentsCallback) {
                var doctorUrl = config.doctor.url + document.externalDocumentId;
                restler.get(doctorUrl).on('complete', function(data, response) {
                    if (data instanceof Error || response.statusCode !== 200) {
                      console.log('Unable to fetch the json for ' + doctorUrl);
                      console.log(JSON.stringify(data, null, '\t'));
                      documentsCallback(data, null);
                      return;
                    }
                    var dir = path.join('out', target, item.url);
                    fs.ensureDirSync(dir);

                    document.doctor = data;
                    document.doctor.filename = path.join(item.url, path.basename(data.originalName));
                    // MGS-1099 for backwards compatibility setting doctor
                    // content of first document as contentItem.doctor field.
                    if (document.uuid === item.documents[0].uuid) {
                      item.doctor = document.doctor;
                    }

                    async.series([
                        function (cb) { writeDocument(dir, item, document, cb); },
                        function (cb) { writeThumbnails(dir, item, document, cb);}
                      ],
                      function (err, data) {
                        documentsCallback(err, data);
                      });
                    });
                  },
                  function(err, data) {
                    console.log('DONE, calling parent callback');
                      parentCallback(err, item);
                  }
            );

        }
    };
};
