'use strict';

var path = require('path');
var cachePath = path.join('out', '.amphora');
var assembledCachePath = path.join(cachePath, 'assembled');
var fs = require('fs-extra');
fs.ensureDirSync(assembledCachePath);

var getLocalPath = function(resource, callback) {
    var cachedResource = path.join(cachePath, resource.storage.checksum);
    fs.exists(cachedResource, function(exists) {
        if (exists) {
            console.log('Amphora', 'local-cache-path', resource.storage.checksum, '->', resource.destination);
            callback(null, cachedResource);
        } else {
            callback(resource.storage.checksum + ' is NOT cached');
        }
    });
};

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

var cacheResource = function(stream, resource, callback) {
    var cachedResource = path.join(cachePath, resource.storage.checksum);
    var file = fs.createWriteStream(cachedResource);
    stream.pipe(file);
    file.on('finish', function() {
        fs.ensureSymlink(cachedResource, resource.destination, function() {
            callback();
        });
    });
};

var checkAssembledResource = function(uuid, callback) {
    var checksumFile = path.join(assembledCachePath, uuid + '.checksum');
    fs.exists(checksumFile, function(exists) {
        if (exists) {
            fs.readFile(checksumFile, 'UTF-8', function(err, data) {
                callback(data);
            });
        } else {
            callback();
        }
    });
};

var getAssembledResource = function(uuid, callback) {
    var contentFile = path.join(assembledCachePath, uuid + '.assembled');
    fs.readFile(contentFile, 'UTF-8', function(err, data) {
        callback(JSON.parse(data));
    });
};

var storeAssembledResource = function(uuid, resource, callback) {
    var checksumFile = path.join(assembledCachePath, uuid + '.checksum');
    var contentFile = path.join(assembledCachePath, uuid + '.assembled');
    fs.writeFile(contentFile, JSON.stringify(resource), 'UTF-8', function(err) {
        if (!err) {
            fs.writeFile(checksumFile, resource.metadata.partialChecksum, 'UTF-8', callback);
        } else {
            callback();
        }
    });
};

module.exports = {
    getLocalPath: getLocalPath,
    getLocalResource: getLocalResource,
    cacheResource: cacheResource,
    checkAssembledResource: checkAssembledResource,
    getAssembledResource: getAssembledResource,
    storeAssembledResource: storeAssembledResource
};
