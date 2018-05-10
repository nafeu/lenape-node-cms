var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var WordSchema   = new Schema({
    name: String,
    audioId: String,
    snapshots: [{
      type: String
    }]
});

module.exports = mongoose.model('Word', WordSchema);