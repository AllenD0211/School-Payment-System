const nodemailer = require("nodemailer");

exports.sendEmail = async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
