const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Parfum Premium" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your verification code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e5e5;border-radius:4px">
        <h2 style="margin:0 0 8px;font-weight:300;letter-spacing:2px;text-transform:uppercase">Parfum Premium</h2>
        <p style="color:#555;margin:0 0 24px">Your one-time verification code:</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1a1a1a;margin-bottom:24px">${otp}</div>
        <p style="color:#888;font-size:13px;margin:0">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  });
};
