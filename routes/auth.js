const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

// Helper to ensure MongoDB connection is active before running queries
const ensureDbConnected = async () => {
    if (mongoose.connection.readyState !== 1) {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (mongoURI) {
            await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
        }
    }
};

// OTP Memory Store
const otpStore = {};

// -------------------------------------------------------------
// 1. SEND OTP FOR LOGIN
// -------------------------------------------------------------
router.post('/send-otp', async(req, res) => {
    const { email, password } = req.body;
    try {
        await ensureDbConnected();
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'User not found. Please register first.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid password.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = { otp, expires: Date.now() + 300000, type: 'login' };

        await sendEmail({
            to: email,
            subject: 'Tourist Safety System - Login OTP',
            text: `Welcome back! Your secure login OTP is: ${otp}. Valid for 5 minutes.`
        });

        res.json({ success: true, msg: 'OTP sent to your email successfully.' });
    } catch (err) {
        console.error('Login OTP send error:', err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------------------------------------------------
// 2. SEND OTP FOR REGISTRATION
// -------------------------------------------------------------
router.post('/register-send-otp', async(req, res) => {
    const { name, email, password, phone, role } = req.body;
    try {
        await ensureDbConnected();
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists. Please login.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        otpStore[email] = {
            otp,
            expires: Date.now() + 300000,
            type: 'register',
            userData: { name, email, password: hashedPassword, phone, role }
        };

        await sendEmail({
            to: email,
            subject: 'Tourist Safety System - Registration OTP',
            text: `Hi ${name}, Your OTP to register an account is: ${otp}. Valid for 5 minutes.`
        });

        res.json({ success: true, msg: 'OTP sent to your email successfully.' });
    } catch (err) {
        console.error('Register OTP send error:', err);
        res.status(500).json({ error: err.message });
    }
});

// -------------------------------------------------------------
// 3. VERIFY OTP
// -------------------------------------------------------------
router.post('/verify-otp', async(req, res) => {
    const { email, otp } = req.body;
    try {
        await ensureDbConnected();
        const record = otpStore[email];
        if (!record || record.otp !== otp || Date.now() > record.expires) {
            return res.status(400).json({ msg: 'Invalid or Expired OTP' });
        }

        let user;
        if (record.type === 'register') {
            user = new User(record.userData);
            await user.save();
        } else {
            user = await User.findOne({ email });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '1d' }
        );

        delete otpStore[email];

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
