const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER,
    pass: process.env.APP_PASSWORD,
  },
});
const sendMail = async (to, subject, message) => {
  const info = await transporter.sendMail({
    from: `"ProManage" ${process.env.USER}`,
    to,
    subject,
    html: message,
  });
  return info;
};
module.exports = sendMail;
