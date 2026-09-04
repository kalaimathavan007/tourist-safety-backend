const nodemailer = require('nodemailer');

// Nodemailer Transporter Setup (Port 587 STARTTLS)
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
 * Uses Resend HTTP API or Brevo HTTP API (Port 443) for 0.3s lightning fast delivery on Cloud.
 * Falls back to Nodemailer SMTP automatically.
 */
const sendEmail = async ({ to, subject, text, html }) => {
    const resendKey = (process.env.RESEND_API_KEY || process.env.RESEND_KEY || '').trim();
    const brevoKey = (process.env.BREVO_API_KEY || '').trim();

    // 1. Use Resend HTTP API if key is provided
    if (resendKey) {
        console.log('🚀 Sending email via Resend HTTP API to:', to);
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'onboarding@resend.dev',
                    to: Array.isArray(to) ? to : [to],
                    subject,
                    text,
                    html: html || `<div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 8px; background: #f4f6f9;"><h2 style="color: #1e3c72;">Journey Guard</h2><p style="font-size: 1.1rem; color: #333;">${text}</p></div>`
                })
            });
            const data = await response.json();
            if (response.ok && data.id) {
                console.log('✅ Email sent via Resend HTTP API:', data.id);
                return { success: true, messageId: data.id };
            } else {
                console.error('❌ Resend API Error:', data);
                throw new Error(`Resend Error: ${data.message || data.name || 'Failed to send email via Resend'}`);
            }
        } catch (err) {
            console.error('❌ Resend HTTP failed:', err.message);
            if (!brevoKey) throw err;
        }
    }

    // 2. Use Brevo HTTP API if key is provided
    if (brevoKey) {
        console.log('🚀 Sending email via Brevo HTTP API to:', to);
        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'api-key': brevoKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: 'Tourist Safety', email: process.env.EMAIL_USER || 'kalaimathavan007@gmail.com' },
                    to: (Array.isArray(to) ? to : [to]).map(e => ({ email: e })),
                    subject,
                    textContent: text,
                    htmlContent: html || `<p>${text}</p>`
                })
            });
            const data = await response.json();
            if (response.ok) {
                console.log('✅ Email sent via Brevo HTTP API:', data.messageId);
                return { success: true, messageId: data.messageId };
            } else {
                console.error('❌ Brevo API Error:', data);
                throw new Error(`Brevo Error: ${data.message || 'Failed to send email via Brevo'}`);
            }
        } catch (err) {
            console.error('❌ Brevo HTTP failed:', err.message);
            throw err;
        }
    }

    // 3. Nodemailer Fallback
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('EMAIL_USER, EMAIL_PASS, or RESEND_API_KEY is missing in server environment variables.');
    }

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
