const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs');

router.post('/generate', async(req, res) => {
    const { touristName, location, message, time } = req.body;
    const doc = new PDFDocument();
    const filename = `efir_${Date.now()}.pdf`;
    const stream = fs.createWriteStream(filename);
    doc.pipe(stream);
    doc.fontSize(20).text('E-FIR Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Tourist Name: ${touristName}`);
    doc.text(`Location: ${location.lat}, ${location.lng}`);
    doc.text(`Message: ${message}`);
    doc.text(`Time: ${new Date(time).toLocaleString()}`);
    doc.end();
    stream.on('finish', () => {
        res.download(filename, () => fs.unlinkSync(filename));
    });
});

module.exports = router;