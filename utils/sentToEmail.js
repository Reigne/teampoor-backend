const nodemailer = require("nodemailer");

// Create a transporter object using your Gmail credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "reignelegend18@gmail.com",
    pass: "arxzlvahlfuzmbvk",
  },
});

const sendtoEmail = async (email, subject, html) => {
  try {
    // Send email
    await transporter.sendMail({
      from: "reignelegend18@gmail.com",
      to: email,
      subject: html,
     });

    console.log(`Email sent successfully to ${html}`);

  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = sendtoEmail;
