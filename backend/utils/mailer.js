const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const stripHtml = (html) =>
  String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sendMail = async (to, subject, content, options = {}) => {
  const htmlEnabled = options?.html === true;
  const fromAddress = `School Payment System <${process.env.EMAIL_USER}>`;
  const normalizedContent = String(content || "");
  const textContent = String(
    options?.text ||
      (htmlEnabled ? stripHtml(normalizedContent) : normalizedContent),
  );

  const payload = {
    from: fromAddress,
    replyTo: process.env.EMAIL_USER,
    to,
    subject,
    text: textContent,
  };

  if (htmlEnabled) {
    payload.html = normalizedContent;
  }

  return transporter.sendMail(payload);
};

module.exports = sendMail;
