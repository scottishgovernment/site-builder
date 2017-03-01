'use strict';

/**
 * Code used to diff site indexes.
 **/
module.exports = function() {
    var fs = require('fs');

    return {

        lastBuildIndex : function (indexPath) {
            var index = [];
            console.log('------');
            console.log('indexPath:', indexPath);
            console.log('------');
            if (fs.existsSync(indexPath)) {
                index = JSON.parse(fs.readFileSync(indexPath));
            }
            return index;
        },

        diffBuildIndexes : function (newIndex, oldIndex) {
            // map the indices by their ids
            oldIndex.byId = {};
            oldIndex.forEach( item => oldIndex.byId[item.id] = item);
            newIndex.byId = {};
            newIndex.forEach( item => newIndex.byId[item.id] = item);

            function newOrChanged(item) {
                var oldItem = oldIndex.byId[item.id];
                return oldItem === undefined || item.hash !== oldItem.hash;
            }

            return {
                newIndex: newIndex,
                oldIndex: oldIndex,
                // write these files - they have either changed or are new
                changedOrNew: newIndex.filter(newOrChanged).map(item => item.id),
                // delete these from the build
                deleted: oldIndex.filter(item => !newIndex.byId[item.id]).map(item => item.id)
            };
        }
    };
};
