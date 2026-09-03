const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');

router.post('/email', async(req, res) => {
    const { to, subject, text } = req.body;
    try {
        await sendEmail({ to, subject, text });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
