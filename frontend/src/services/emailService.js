export const sendEmail = async (email, subject, message) => {
  return await fetch("http://localhost:5000/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, subject, message }),
  });
};
