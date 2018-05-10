var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var WordSchema   = new Schema({
    englishName: String,
    definition: String,
    name: String,
    audioId: String,
    snapshotIds: [{
      type: String
    }],
    notes: String,
    isQueued: {
        type: Boolean,
        default: false
    },
    isProcessed: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Word', WordSchema);