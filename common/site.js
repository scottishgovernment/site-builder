'use strict';

var path = require('path');

module.exports = function () {
    return require(path.join(process.cwd(), 'resources/site.js'));
};
