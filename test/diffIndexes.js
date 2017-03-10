const siteIndexes = require('../publish/site-indexes')();
const fs = require('fs');

const leftIndex = JSON.parse(fs.readFileSync(process.argv[2]));
const rightIndex = JSON.parse(fs.readFileSync(process.argv[3]));

const diff = siteIndexes.diffBuildIndexes(leftIndex, rightIndex);
console.log('Changed or New: ', JSON.stringify(diff.changedOrNew, null, '\t'));
console.log('Deleted       : ', JSON.stringify(diff.deleted, null, '\t'));
