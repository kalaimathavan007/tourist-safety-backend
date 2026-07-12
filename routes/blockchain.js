const express = require('express');
const router = express.Router();
let incidents = [];

router.post('/store', async(req, res) => {
    const { incidentId, data } = req.body;
    const hash = `0x${Buffer.from(JSON.stringify(data)).toString('hex')}`;
    incidents.push({ incidentId, hash, timestamp: Date.now() });
    res.json({ success: true, hash });
});

module.exports = router;