const express = require('express');
const router = express.Router();
const { predictRisk, AnomalyDetector, chatbotResponse } = require('../services/aiService');
const auth = require('../middleware/auth');

const anomalyDetector = new AnomalyDetector();

router.post('/risk', auth, async(req, res) => {
    try {
        const { lat, lng, time } = req.body;
        const pastIncidents = [];
        const risk = await predictRisk(lat, lng, time, pastIncidents);
        res.json(risk);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/anomaly', auth, (req, res) => {
    try {
        const { lat, lng } = req.body;
        const userId = req.user.id;
        const anomaly = anomalyDetector.addLocation(userId, lat, lng);
        if (anomaly) res.json({ anomaly: true, message: anomaly.message });
        else res.json({ anomaly: false });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/chat', auth, (req, res) => {
    const { message, mode = 'offline' } = req.body;
    const reply = chatbotResponse(message, { mode });
    res.json({ reply, mode });
});

module.exports = router;