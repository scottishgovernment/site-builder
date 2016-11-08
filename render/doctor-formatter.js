var restler = require('restler');
var path = require('path');
var fs = require('fs-extra');
var request = require('request');
var async = require('async');
var thumbnailWidths = [107, 165, 214, 330];

var writeDocument = function(dir, item, document, callback) {
  var filename = path.join(dir, path.basename(document.amphora.metadata.filename));
  var stream = fs.createWriteStream(filename);
  var downloadUrl = document.amphora._links.attachment.href;
  request.get(downloadUrl)
    .on('end', callback)
    .pipe(stream);
};

var writeThumbnail = function(width, dir, item, document, callback) {
  var originalName = document.amphora.metadata.filename;
  var filename = path.join(dir,
    path.basename(originalName, path.extname(originalName))
    + '.' + width + '.jpg');
  var stream = fs.createWriteStream(filename);
  var imageUrl = document.amphora._links.inline.href + '?type=jpg&size=' + width;
  request.get(imageUrl)
    .on('end', callback)
    .pipe(stream);
};

var writeThumbnails = function(dir, item, document, callback) {
  async.each(thumbnailWidths,
    function (width, cb) {
      writeThumbnail(width, dir, item, document, cb);
    },
    callback
  );
};

module.exports = exports = function(config, target) {
    process.mode  = process.mode || 'site';

    return {
        // for a content item, fetch meta data from doctor and write out any pdf and jpg files
        formatDoctorFiles: function(item, auth, visibility, parentCallback) {
            item.documents = item.contentItem._embedded.documents;
            if (!item.documents || item.documents.length === 0) {
                // content item does not have any document references
                parentCallback();
                return;
            }
            async.each(item.documents,
              function(document, documentsCallback) {
                  var amphoraUrl = config.amphora.endpoint + 'resource/docs/' + document.externalDocumentId;
                  restler.get(amphoraUrl).on('complete', function(data, response) {
                      if (data instanceof Error || response.statusCode !== 200) {
                        console.log('Unable to fetch the json for ' + amphoraUrl);
                        return;
                      }
                      var dir = path.join('out', target, item.url);
                      fs.ensureDirSync(dir);
                      document.amphora = data;
                      document.amphora.filename = path.join(item.url, path.basename(data.metadata.filename));
                      // MGS-1099 for backwards compatibility setting doctor
                      // content of first document as contentItem.doctor field.
                      if (document.uuid === item.documents[0].uuid) {
                        item.amphora = document.amphora;
                      }
                      async.parallel([
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
