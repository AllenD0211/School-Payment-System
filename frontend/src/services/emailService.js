import { apiUrl } from "@/lib/api";

export const sendEmail = async (email, subject, message) => {
  return await fetch(apiUrl("/api/send-email"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, subject, message }),
  });
};
