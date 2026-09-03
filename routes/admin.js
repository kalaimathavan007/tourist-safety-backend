const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dns = require('dns');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

// Store OTPs temporarily (in-memory for demo)
const otpStore = new Map();

// Email transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false }
});

// Allowed admin email from .env
const ALLOWED_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

// Send OTP
router.post('/send-otp', async(req, res) => {
    const { email } = req.body;
    if (email !== ALLOWED_ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Unauthorized email' });
    }
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 }); // 5 min
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Admin Login OTP',
            text: `Your OTP for admin login is ${otp}. Valid for 5 minutes.`,
        });
        res.json({ success: true, message: 'OTP sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Verify OTP and login
router.post('/verify-otp', async(req, res) => {
    const { email, otp } = req.body;
    if (email !== ALLOWED_ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Unauthorized email' });
    }
    const record = otpStore.get(email);
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