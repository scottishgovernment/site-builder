var slugify = require('slug');
slugify.defaults.mode ='mygovscot';
slugify.defaults.modes['mygovscot'] = {
    replacement: '-',
    symbols: true,
    remove: /[']/g,
    lower: true,
    charmap: slugify.charmap,
    multicharmap: slugify.multicharmap
};

module.exports = slugify;
