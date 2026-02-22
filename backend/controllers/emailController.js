const sendMail = require("../utils/mailer");

exports.sendEmail = async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    await sendMail(email, subject, message);

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};