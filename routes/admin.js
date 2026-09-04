const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

// Store OTPs temporarily (in-memory for demo)
const otpStore = new Map();

// Allowed admin email from .env (defaults to kalaimathavan007@gmail.com or EMAIL_USER)
const getAdminEmail = () => (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'kalaimathavan007@gmail.com').toLowerCase().trim();

// Send OTP
router.post('/send-otp', async(req, res) => {
    const { email } = req.body;
    const allowedEmail = getAdminEmail();

    if (!email || email.toLowerCase().trim() !== allowedEmail) {
        return res.status(403).json({ error: `Unauthorized email (${email}). Must match Admin Email (${allowedEmail})` });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    const adminEmailFormatted = email.toLowerCase().trim();
    otpStore.set(adminEmailFormatted, { otp, expires: Date.now() + 5 * 60 * 1000 }); // 5 min
    try {
        await sendEmail({
            to: adminEmailFormatted,
            subject: 'Admin Login OTP',
            text: `Your OTP for admin login is ${otp}. Valid for 5 minutes.`,
        });
        res.json({ success: true, message: 'OTP sent' });
    } catch (err) {
        console.error('Admin OTP Send Error:', err);
        res.status(500).json({ error: err.message || 'Failed to send OTP' });
    }
});

// Verify OTP and login
router.post('/verify-otp', async(req, res) => {
    const { email, otp } = req.body;
    const allowedEmail = getAdminEmail();
    const adminEmailFormatted = email ? email.toLowerCase().trim() : '';

    if (adminEmailFormatted !== allowedEmail) {
        return res.status(403).json({ error: 'Unauthorized email' });
    }
    const record = otpStore.get(adminEmailFormatted);
    if (!record || record.otp !== otp || record.expires < Date.now()) {
        return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    otpStore.delete(email);
    // Find or create admin user
    let user = await User.findOne({ email });
    if (!user) {
        user = new User({ name: 'Admin', email, password: 'admin-otp-only', role: 'admin' });
        await user.save();
    } else {
        user.role = 'admin';
        await user.save();
    }
    const token = jwt.sign({ id: user.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'admin' } });
});

// Get all users with last location (for admin dashboard)
router.get('/users', auth, async(req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const users = await User.find({}, '-password -encryptedName -encryptedEmail -encryptedPhone -blockchainHash');
    const usersWithLocation = await Promise.all(users.map(async(user) => {
        const latestAlert = await Alert.findOne({ touristId: user.id }).sort({ createdAt: -1 });
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            lastLocation: latestAlert ? latestAlert.location : null,
            lastAlertTime: latestAlert ? latestAlert.createdAt : null,
        };
    }));
    res.json(usersWithLocation);
});

// Get alerts for a specific user
router.get('/user-alerts/:userId', auth, async(req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const alerts = await Alert.find({ touristId: req.params.userId }).sort({ createdAt: -1 });
    res.json(alerts);
});

module.exports = router;
