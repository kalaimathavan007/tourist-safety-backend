const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// simple in-memory OTP store (demo)
const otpStore = new Map();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.post('/register', async(req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user = new User({ name, email, password: hashedPassword, role: role || 'tourist', phone });
        await user.save();
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name, email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.post('/login', async(req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;

// POST /api/auth/send-otp and /api/auth/verify-otp
router.post('/send-otp', async(req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your login OTP',
            text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
        });
        return res.json({ success: true });
    } catch (err) {
        console.error('send-otp error', err);
        return res.status(500).json({ error: 'Failed to send OTP' });
    }
});

router.post('/verify-otp', async(req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
    const rec = otpStore.get(email);
    if (!rec || rec.otp !== otp || rec.expires < Date.now()) {
        return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    otpStore.delete(email);
    let user = await User.findOne({ email });
    if (!user) {
        // create a new tourist account for OTP login
        user = new User({ name: email.split('@')[0], email, password: 'otp-only', role: 'tourist' });
        await user.save();
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});