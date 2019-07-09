const nodemailer = require('nodemailer');
const pug = require('pug')
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

// transport.sendMail({
//     from: "Rajendra M <techemail.rajesh@gmail.com>",
//     to: "montu@test.com",
//     subject: "Test email with mail trap io",
//     html: "Hey How are you dude",
//     text: "Hey Hello, what are you doing"
// });

const generateHtml = (filename, options = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
    const inlineCss = juice(html);
    return inlineCss;
}


exports.send = async (options) => {
    const html = generateHtml(options.filename, options);

    const mailOptions = {
        from: "Rajendra M <techemail.rajesh@gmail.com>",
        to: options.user.email,
        subject: options.subject,
        html,
        text: htmlToText.fromString(html)
    };
    const sendEmail = promisify(transport.sendMail, transport);
    await sendEmail(mailOptions);
};