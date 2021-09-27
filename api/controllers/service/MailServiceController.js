const nodemailer = require("nodemailer");


module.exports = {

    send: async function (req, res, next) {
        let transporter = nodemailer.createTransport(req.body.config);

        let info = await transporter.sendMail({
            from: req.body.from,
            to: req.body.to,
            subject: req.body.subject,
            html: req.body.message,
        });
        res.json({ err: false, code: 'mail/send', message: info });
    },

}
