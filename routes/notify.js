const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
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