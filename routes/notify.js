const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const dns = require('dns');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
});

router.post('/email', async(req, res) => {
    const { to, subject, text } = req.body;
    try {
        await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;