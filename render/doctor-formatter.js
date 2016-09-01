var restler = require('restler');
var path = require('path');
var fs = require('fs-extra');
var request = require('request');
var async = require('async');
var thumbnailWidths = [107, 165, 214, 330];

var writeDocument = function(dir, item, document, auth, callback) {
  var filename = path.join(dir, path.basename(document.amphora.metadata.filename));
  var stream = fs.createWriteStream(filename);
  var downloadUrl = document.amphora._links.attachment.href;
  request.get(downloadUrl, auth)
    .on('end', callback)
    .pipe(stream);
}

var writeThumbnail = function(width, dir, item, document, auth, callback) {
  var originalName = document.amphora.metadata.filename;
  var filename = path.join(dir,
    path.basename(originalName, path.extname(originalName))
    + '.' + width + '.jpg');
  var stream = fs.createWriteStream(filename);
  var imageUrl = document.amphora._links.inline.href + '?size=' + width;
  request.get(imageUrl, auth)
    .on('end', callback)
    .pipe(stream);
}

var writeThumbnails = function(dir, item, document, auth, callback) {
  async.each(thumbnailWidths,
    function (width, cb) {
      writeThumbnail(width, dir, item, document, auth, cb);
    },
    callback
  );
}

module.exports = exports = function(config, target) {
    process.mode  = process.mode || 'site';

    var authentication = require('./amphora/authentication')(config, restler);

    var withAuth = function(auth, callback) {
        if (process.mode === 'site') {
            authentication.login(function(err, token) {
                auth = {headers: {'Authorization' : 'Bearer ' + token}};
                auth.done = function(cb) {
                    authentication.logout(token, cb);
                }; callback(auth);
            });
        } else {
            auth.done = function(cb) {
                cb();
            }; callback(auth);
        }
    }

    return {
        // for a content item, fetch meta data from doctor and write out any pdf and jpg files
        formatDoctorFiles: function(item, auth, parentCallback) {
            item.documents = item.contentItem._embedded.documents;
            if (!item.documents || item.documents.length === 0) {
                // content item does not have any document references
                parentCallback();
                return;
            }
            async.each(item.documents,
              function(document, documentsCallback) {
                withAuth(auth, function(auth) {
                  var amphoraUrl = config.amphora.endpoint + 'resource/docs/' + document.externalDocumentId;
                  restler.get(amphoraUrl, auth).on('complete', function(data, response) {
                      if (data instanceof Error || response.statusCode !== 200) {
                        console.log('Unable to fetch the json for ' + amphoraUrl);
                        auth.done(function() {
                          documentsCallback(data, null);
                        });
                        return;
                      }
                      var dir = path.join('out', target, item.url);
                      fs.ensureDirSync(dir);
                      document.amphora = data;
                      document.amphora.filename = path.join(item.url, path.basename(data.metadata.filename));
                      // MGS-1099 for backwards compatibility setting doctor
                      // content of first document as contentItem.doctor field.
                      if (document.uuid === item.documents[0].uuid) {
                        item.doctor = document.amphora;
                      }

                      async.parallel([
                          function (cb) { writeDocument(dir, item, document, auth, cb); },
                          function (cb) { writeThumbnails(dir, item, document, auth, cb);}
                        ],
                        function (err, data) {
                          auth.done(function() {
                            documentsCallback(err, data);
                          });
                        });
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
