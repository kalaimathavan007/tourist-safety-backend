const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const User = require('../models/User');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
const IV_LENGTH = 16;

function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

router.post('/store', auth, async(req, res) => {
    try {
        const { name, email, phone } = req.body;
        const encryptedName = encrypt(name);
        const encryptedEmail = encrypt(email);
        const encryptedPhone = encrypt(phone);
        const blockchainHash = `0x${crypto.randomBytes(32).toString('hex')}`;
        await User.findByIdAndUpdate(req.user.id, {
            encryptedName,
            encryptedEmail,
            encryptedPhone,
            blockchainHash
        });
        res.json({ success: true, blockchainHash });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/my', auth, async(req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.encryptedName) return res.json({ hasIdentity: false });
        const name = decrypt(user.encryptedName);
        const email = decrypt(user.encryptedEmail);
        const phone = decrypt(user.encryptedPhone);
        res.json({ name, email, phone, blockchainHash: user.blockchainHash });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;