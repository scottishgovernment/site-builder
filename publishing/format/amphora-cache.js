'use strict';

var path = require('path');
var cachePath = path.join('out', '.amphora');
var fs = require('fs-extra');
fs.ensureDirSync(cachePath);

var getLocalResource = function(resource, callback) {
    var cachedResource = path.join(cachePath, resource.storage.checksum);
    fs.exists(cachedResource, function(exists) {
        if (exists) {
            console.log('Amphora', 'local-cache', resource.storage.checksum, '->', resource.destination);
            callback(null, fs.createReadStream(cachedResource));
        } else {
            callback(resource.storage.checksum + ' is NOT cached');
        }
    });
};

var cacheResource = function(resource, callback) {
    var cachedResource = path.join(cachePath, resource.storage.checksum);
    var file = fs.createWriteStream(cachedResource);
    fs.createReadStream(resource.destination).pipe(file);
    file.on('finish', callback)
};

module.exports = {
    getLocalResource: getLocalResource,
    cacheResource: cacheResource
};