const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    place: { type: String, required: true },
    visitDate: { type: Date, default: Date.now },
    status: { type: String, default: 'visited' }
});

module.exports = mongoose.model('History', historySchema);