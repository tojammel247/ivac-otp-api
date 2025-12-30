const express = require('express');
const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/get-otp', async (req, res) => {
    const userEmail = req.query.email;
    const appPassword = req.query.password;

    if (!userEmail || !appPassword) {
        return res.status(400).send("Email and App Password required");
    }

    const config = {
        imap: {
            user: userEmail,
            password: appPassword,
            host: 'imap.gmail.com',
            port: 993,
            tls: true,
            authTimeout: 3000,
            tlsOptions: { rejectUnauthorized: false }
        }
    };

    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // গত ৫ মিনিটের ইমেইল সার্চ করবে
        let delay = 5 * 60 * 1000;
        let yesterday = new Date(Date.now() - delay).toISOString();
        const searchCriteria = ['UNSEEN', ['SINCE', yesterday], ['FROM', 'onlinepayment@sslcommerz.com']];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };

        const messages = await connection.search(searchCriteria, fetchOptions);
        
        if (messages.length === 0) {
            connection.end();
            return res.send("OTP not found");
        }

        // সর্বশেষ ইমেইলটি পড়া
        const allBodyParts = messages[messages.length - 1].parts.filter(part => part.which === 'TEXT');
        const mail = await simpleParser(allBodyParts[0].body);
        
     // আপনার সার্ভার কোডের এই অংশটি এইভাবে লিখুন:
const otpMatch = mail.text ? mail.text.match(/\b\d{6}\b/) : null;
const otp = otpMatch ? otpMatch[0] : "OTP not found";

        connection.end();
        res.send(otp);

    } catch (err) {
        res.status(500).send("Login Failed: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
