import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465, // true for 465, false for other ports
  host: process.env.TRANSPORTER_EMAIL_HOST,
  auth: {
    user: process.env.TRANSPORTER_EMAIL,
    pass: process.env.TRANSPORTER_EMAIL_PASSWORD,
  },
  secure: true,
});

const sendEmail = (mailData: any) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailData, (error: any, info: any) => {
      if (error) {
        console.error("Error sending email:", error);
        reject(error);
      } else {
        console.log("Email sent:", info.response);
        resolve(info);
      }
    });
  });
};

export { transporter, sendEmail };
