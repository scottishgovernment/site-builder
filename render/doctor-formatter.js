module.exports = exports = function(config) {

  var restler = require('restler');
  var path = require('path');
  var fs = require('fs-extra');
  var http = require('http');
  var async = require('async');

  return {

    // for a content item, fetch meta data from doctor and write out any pdf and jpg files
    formatDoctorFiles: function(item, callback) {
      if (!item.contentItem.pdfUUID) {
        // nothing to fetch fo this Item
        callback();
        return;
      }

      var doctorUrl = config.doctor.url + item.contentItem.pdfUUID;
      restler
        .get(doctorUrl)
        .on("complete", function(data, response) {
          if (data instanceof Error || response.statusCode !== 200) {
            console.log("Unable to fetch the json for " + doctorUrl);
            console.log(JSON.stringify(data, null, '\t'));
            callback(error);
          } else {
            // ensure that a directory exists for this item
            var dir = path.join("out", "pages", item.url);
            fs.ensureDirSync(dir);

            // enrich the item with meta data from doctor
            item.doctor = {};
            item.doctor.pageCount = data.pageCount;
            item.doctor.size = data.size;
            item.doctor.lastUpdated = data.lastUpdated;

            // save binaries to dist
            async.each(
              data.binaries,
              function(binary, cb) {
                var filename = path.join(dir, path.basename(binary));

                // if this is a
                if (filename.indexOf('.pdf') === filename.length - 4) {
                  item.doctor.filename = path.join(item.url, path.basename(binary));
                }

                var file = fs.createWriteStream(filename);
                http.get(config.doctor.url + binary, function(response) {
                  response.pipe(file);
                  response.on('end', cb);
                });
              },
              function(err) {
                callback(err, item);
              });
          }
        });
    }
  };
};
