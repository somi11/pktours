// const nodemailer = require('nodemailer');

// const sendEmail = async (options) => {
//   //1 create transporter
//   const transporter = nodemailer.createTransport({
//     service: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });
//   //Define the email options
//   const emailOptions = {
//     from: 'Somi <somisun41@gmail.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.emssage,
//   };
//   //send the email
//   await transporter.sendEmail(emailOptions);
// };

// module.exports = sendEmail;
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `RAB NAWAZ HUSSAIN <${process.env.EMAIL_FROM}>`;
  }
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return 1;
    }

    // 1) Create a transporter
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    // return nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.GMAIL_USER,
    //     pass: process.env.GMAIL_PASSWORD
    //   }
    // });
  }

  async send(template, subject) {
    //1 render html based on pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      { firstName: this.firstName, url: this.url, subject }
    );
    //2 define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
      // html:
    };

    //3 create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'welcom to the pk tours family');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Password Reset link');
  }
};
