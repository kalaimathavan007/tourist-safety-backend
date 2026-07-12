const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['tourist', 'admin'], default: 'tourist' },
    phone: { type: String },
    emergencyContact: { type: String },
    // Blockchain identity fields (encrypted)
    encryptedName: String,
    encryptedEmail: String,
    encryptedPhone: String,
    blockchainHash: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);