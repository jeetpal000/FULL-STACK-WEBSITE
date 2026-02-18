import nodemailer from "nodemailer";
import "dotenv/config";
// const testAccount = await nodemailer.createTestAccount();

const transporter = nodemailer.createTransport({
  service: "gmail",
  // host: "smtp.ethereal.email",
  // port: 587,
  host: "smtp.gmail.com", 
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
  });
  // const testEmailURL = nodemailer.getTestMessageUrl(info);
  // console.log(testEmailURL);
};
