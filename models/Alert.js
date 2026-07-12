const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    touristId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    touristName: { type: String },
    location: { lat: Number, lng: Number },
    type: { type: String, enum: ['geo_fence', 'sos', 'risk'], default: 'sos' },
    message: { type: String },
    status: { type: String, enum: ['active', 'resolved'], default: 'active' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);