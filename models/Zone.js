const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
    name: { type: String, required: true },
    riskScore: { type: Number, default: 50 },
    riskLevel: { type: String, default: 'HIGH' },
    reason: { type: String, required: true },
    center: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    coordinates: {
        type: [
            [Number]
        ],
        required: true
    },
    type: { type: String, enum: ['warning', 'danger'], default: 'danger' },
    level: { type: String, enum: ['warning', 'danger'], default: 'danger' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Zone', zoneSchema);
