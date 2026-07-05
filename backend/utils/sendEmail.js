const nodemailer = require('nodemailer');

const sendEmail = async(destinataire, sujet, contenu) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Billetterie Intelligente" <${process.env.EMAIL_USER}>`,
            to: destinataire,
            subject: sujet,
            html: contenu,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email envoyé à ${destinataire}`);
    } catch (error) {
        console.error(`Erreur envoi email : ${error.message}`);
        throw error;
    }
};

module.exports = sendEmail;