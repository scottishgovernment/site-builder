const siteIndexes = require('../publish/site-indexes')();
const fs = require('fs');

var leftIndex = JSON.parse(fs.readFileSync(process.argv[2]));
var rightIndex = JSON.parse(fs.readFileSync(process.argv[3]));

// filter out uncacheable items
var leftIndexCacheable = leftIndex.filter(i => i.cacheable);
var rightIndexCacheable = rightIndex.filter(i => i.cacheable);

const diff = siteIndexes.diffBuildIndexes(leftIndexCacheable, rightIndexCacheable);
console.log('Changed or New: ', JSON.stringify(diff.changedOrNew, null, '\t'));
console.log('Deleted       : ', JSON.stringify(diff.deleted, null, '\t'));
