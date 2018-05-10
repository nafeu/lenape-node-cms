var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SnapshotSchema   = new Schema({
    dataUrl: String
});

module.exports = mongoose.model('Snapshot', SnapshotSchema);