var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var WordSchema   = new Schema({
    name: String,
    audioId: String,
    snapshotIds: [{
      type: String
    }]
});

module.exports = mongoose.model('Word', WordSchema);