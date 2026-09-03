const nodemailer = require('nodemailer');

// 1. Nodemailer Transporter Setup (Port 587 STARTTLS)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false }
});

/**
 * Universal Fast Email Sender
 * Uses Resend HTTP API (Port 443) if RESEND_API_KEY is available for 0.3s lightning fast delivery on Cloud.
 * Falls back to Nodemailer SMTP automatically.
 */
const sendEmail = async ({ to, subject, text, html }) => {
    // A. Use Resend HTTP API if key is provided (Bypasses all SMTP blocks on Render/AWS)
    if (process.env.RESEND_API_KEY) {
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Tourist Safety <onboarding@resend.dev>',
                    to: Array.isArray(to) ? to : [to],
                    subject,
                    text,
                    html: html || `<div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 8px; background: #f4f6f9;"><h2 style="color: #1e3c72;">Journey Guard</h2><p style="font-size: 1.1rem; color: #333;">${text}</p></div>`
                })
            });
            const data = await response.json();
            if (data.id) {
                console.log('✅ Email sent via Resend HTTP API:', data.id);
                return { success: true, messageId: data.id };
            } else {
                console.warn('⚠️ Resend HTTP warning:', data);
            }
        } catch (err) {
            console.error('❌ Resend HTTP failed, using SMTP fallback:', err.message);
        }
    }

    // B. Nodemailer Fallback
    console.log('📧 Sending email via Nodemailer SMTP...');
    return await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html
    });
};

module.exports = { sendEmail };
