const express = require('express');
const router = express.Router();
const Zone = require('../models/Zone');
const auth = require('../middleware/auth');

router.get('/', async(req, res) => {
    try {
        const zones = await Zone.find();
        res.json(zones);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

router.post('/', auth, async(req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    try {
        const { name, coordinates, type, level } = req.body;
        const zone = new Zone({ name, coordinates, type, level: level || type });
        await zone.save();
        res.json(zone);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;