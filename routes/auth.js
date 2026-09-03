const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Password-a encrypt panna
const jwt = require('jsonwebtoken'); // Security token generate panna
const nodemailer = require('nodemailer'); // Email anuppa
const dns = require('dns');
const User = require('../models/User'); // Unga User Database Model

// OTP-kalai temporary-aaga save panna oru object (Memory store)
const otpStore = {};

// Email anuppurathukkana Setup (Gmail)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER, // Unga Gmail address (e.g., 'yourmail@gmail.com')
        pass: process.env.EMAIL_PASS // Gmail App Password
    },
    lookup: (hostname, options, callback) => dns.lookup(hostname, { family: 4 }, callback)
});

// -------------------------------------------------------------
// 1. SEND OTP FOR LOGIN (Erkanave irukkura user-ku)
// -------------------------------------------------------------
router.post('/send-otp', async(req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'User not found. Please register first.' });

        // Password check pandrom
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid password.' });

        // 6-digit OTP create pandrom
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // OTP-ai memory-la save pandrom (Valid for 5 mins)
        otpStore[email] = { otp, expires: Date.now() + 300000, type: 'login' };

        // Email anuppurom
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Tourist Safety System - Login OTP',
            text: `Welcome back! Your secure login OTP is: ${otp}. It is valid for 5 minutes.`
        });

        res.json({ success: true, msg: 'OTP sent to your email successfully.' });
    } catch (err) {
        console.error('Login OTP send error:', err);
        res.status(500).json({ error: err.message });
    }
});


// -------------------------------------------------------------
// 2. SEND OTP FOR REGISTRATION (Pudhusa account create panna)
// -------------------------------------------------------------
router.post('/register-send-otp', async(req, res) => {
    const { name, email, password, phone, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists. Please login.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Database-la save pandrathuku munnadi password-a hash pandrom
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // OTP & User details-ai memory-la save pandrom (Verify aana aprm thaan DB-la pogum)
        otpStore[email] = {
            otp,
            expires: Date.now() + 300000,
            type: 'register',
            userData: { name, email, password: hashedPassword, phone, role }
        };

        // Email anuppurom
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Tourist Safety System - Registration OTP',
            text: `Hi ${name}, Your OTP to register an account is: ${otp}. It is valid for 5 minutes.`
        });

        res.json({ success: true, msg: 'OTP sent to your email successfully.' });
    } catch (err) {
        console.error('Register OTP send error:', err);
        res.status(500).json({ error: err.message });
    }
});


// -------------------------------------------------------------
// 3. VERIFY OTP (Login & Register rendukkum idhu thaan)
// -------------------------------------------------------------
router.post('/verify-otp', async(req, res) => {
    const { email, otp } = req.body;
    try {
        const record = otpStore[email];

        // Check 1: OTP irukka? Match aagutha? Expire aagalaye?
        if (!record || record.otp !== otp || Date.now() > record.expires) {
            return res.status(400).json({ msg: 'Invalid or Expired OTP' });
        }

        let user;

        // Register flow-a iruntha pudhusa Database-la save pandrom
        if (record.type === 'register') {
            user = new User(record.userData);
            await user.save();
        }
        // Login flow-a iruntha Database-la irunthu user-a edukurom
        else {
            user = await User.findOne({ email });
        }

        // Login aana piragu Token tharrom
        const token = jwt.sign({ id: user._id, role: user.role },
            process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '1d' }
        );

        // OTP verify aanathum atha delete pannidrom
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