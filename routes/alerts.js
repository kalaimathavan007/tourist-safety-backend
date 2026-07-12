const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

router.post('/', auth, async(req, res) => {
    try {
        const { location, type, message } = req.body;
        const alert = new Alert({
            touristId: req.user.id,
            touristName: req.user.name,
            location,
            type: type || 'sos',
            message
        });
        await alert.save();
        res.json(alert);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.get('/', auth, async(req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
        const alerts = await Alert.find().sort({ createdAt: -1 });
        res.json(alerts);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

router.get('/my', auth, async(req, res) => {
    try {
        const alerts = await Alert.find({ touristId: req.user.id }).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;