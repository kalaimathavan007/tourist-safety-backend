const express = require('express');
const router = express.Router();
const History = require('../models/History');

// Get History for logged in user
router.get('/', async(req, res) => {
    try {
        // Assume you have auth middleware, for now let's use a query param
        const userId = req.header('x-user-id');
        const history = await History.find({ userId }).sort({ visitDate: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;