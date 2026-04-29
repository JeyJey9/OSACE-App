// src/config/mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log('Transporter email configurat. Se verifică conexiunea...');
mailTransporter.verify(function(error, success) {
  if (error) {
    console.error("Eroare conexiune SMTP:", error);
  } else {
    console.log("Serverul SMTP este pregătit să primească mesaje.");
  }
});

module.exports = mailTransporter;