const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/', async(req, res) => {
    const { text, targetLang } = req.body;
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
        const response = await axios.get(url);
        res.json({ translatedText: response.data.responseData.translatedText });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;