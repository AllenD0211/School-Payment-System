const twilio = require("twilio");

const E164_REGEX = /^\+\d{8,15}$/;

const toStringValue = (value) => String(value || "").trim();

const getFirstEnvValue = (...keys) => {
  for (const key of keys) {
    const value = toStringValue(process.env[key]);
    if (value) return value;
  }
  return "";
};

const normalizePhoneNumber = (value) => {
  const raw = toStringValue(value);
  if (!raw) return "";

  const compact = raw.replace(/[\s()\-]/g, "");
  if (compact.startsWith("+")) {
    const digits = compact.slice(1).replace(/\D/g, "");
    return digits ? `+${digits}` : "";
  }

  const digits = compact.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("63") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("09") && digits.length === 11) {
    return `+63${digits.slice(1)}`;
  }

  if (digits.startsWith("9") && digits.length === 10) {
    return `+63${digits}`;
  }

  return `+${digits}`;
};

const getSmsConfig = () => ({
  accountSid: getFirstEnvValue("TWILIO_ACCOUNT_SID", "TWILIO_SID"),
  authToken: getFirstEnvValue("TWILIO_AUTH_TOKEN", "TWILIO_TOKEN"),
  fromNumber: normalizePhoneNumber(
    getFirstEnvValue("TWILIO_PHONE_NUMBER", "TWILIO_FROM_NUMBER", "TWILIO_FROM", "TWILIO_NUMBER")
  ),
  messagingServiceSid: getFirstEnvValue("TWILIO_MESSAGING_SERVICE_SID", "TWILIO_MESSAGING_SERVICE")
});

const assertSmsConfig = () => {
  const config = getSmsConfig();

  if (!config.accountSid || !config.authToken) {
    throw new Error(
      "Twilio credentials are missing. Set TWILIO_ACCOUNT_SID (or TWILIO_SID) and TWILIO_AUTH_TOKEN (or TWILIO_TOKEN)."
    );
  }

  if (!config.fromNumber && !config.messagingServiceSid) {
    throw new Error(
      "Twilio sender is missing. Set TWILIO_PHONE_NUMBER/TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID."
    );
  }

  return config;
};

let smsClient = null;
const getSmsClient = () => {
  if (!smsClient) {
    const { accountSid, authToken } = assertSmsConfig();
    smsClient = twilio(accountSid, authToken);
  }
  return smsClient;
};

const sendSms = async (to, body) => {
  const messageBody = toStringValue(body);
  if (!messageBody) {
    throw new Error("SMS body is required");
  }

  const normalizedTo = normalizePhoneNumber(to);
  if (!E164_REGEX.test(normalizedTo)) {
    throw new Error("Recipient phone number must be in E.164 format (example: +639171234567)");
  }

  const { fromNumber, messagingServiceSid } = assertSmsConfig();

  const payload = {
    to: normalizedTo,
    body: messageBody
  };

  if (messagingServiceSid) {
    payload.messagingServiceSid = messagingServiceSid;
  } else {
    payload.from = fromNumber;
  }

  const result = await getSmsClient().messages.create(payload);

  return {
    sid: toStringValue(result?.sid),
    status: toStringValue(result?.status),
    to: toStringValue(result?.to),
    from: toStringValue(result?.from || fromNumber),
    messagingServiceSid: toStringValue(result?.messagingServiceSid || messagingServiceSid)
  };
};

const toSmsErrorMessage = (error) => {
  const rawMessage = toStringValue(error?.message || error);
  const normalized = rawMessage.toLowerCase();
  const code = toStringValue(error?.code);
  const withCode = (message) => (code ? `${message} (Twilio code: ${code})` : message);

  if (normalized.includes("authenticate")) {
    return withCode("Invalid Twilio credentials. Check TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN.");
  }

  if (normalized.includes("from") && normalized.includes("phone number")) {
    return withCode(
      "Invalid Twilio sender configuration. TWILIO_PHONE_NUMBER must be a Twilio-owned sender, or use TWILIO_MESSAGING_SERVICE_SID."
    );
  }

  if (normalized.includes("to") && normalized.includes("valid phone")) {
    return withCode("Recipient phone number is invalid. Use E.164 format (example: +639171234567).");
  }

  if (normalized.includes("trial") && normalized.includes("verified")) {
    return withCode("Twilio trial account can send SMS only to verified phone numbers.");
  }

  if (code) {
    return `${rawMessage} (Twilio code: ${code})`;
  }

  return rawMessage || "SMS delivery error";
};

module.exports = {
  normalizePhoneNumber,
  sendSms,
  toSmsErrorMessage
};
