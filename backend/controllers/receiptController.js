const Receipt = require("../models/receiptModel");
const User = require("../models/userModel");
const Student = require("../models/studentModel");
const mongoose = require("mongoose");
const sendMail = require("../utils/mailer");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9()\-\s]{7,20}$/;
const ALLOWED_STATUSES = ["sent", "pending", "delivered", "read", "acknowledged"];
const ALLOWED_CHANNELS = ["email", "sms"];

const toStringValue = (value) => String(value || "").trim();
const normalizeSentVia = (value) => {
  const normalized = toStringValue(value).toLowerCase();
  return ALLOWED_CHANNELS.includes(normalized) ? normalized : "email";
};

const normalizeReceiptStatus = (value) => {
  const normalized = toStringValue(value).toLowerCase();
  return ALLOWED_STATUSES.includes(normalized) ? normalized : "sent";
};

const serializeReceipt = (receipt) => ({
  _id: receipt._id,
  receiptNumber: receipt.receiptNumber,
  parentUserId: receipt.parentUserId,
  studentUserId: receipt.studentUserId,
  studentName: receipt.studentName,
  amount: receipt.amount,
  paymentDescription: receipt.paymentDescription,
  sentVia: receipt.sentVia,
  sentTo: receipt.sentTo,
  paymentDate: receipt.paymentDate,
  status: receipt.status,
  createdAt: receipt.createdAt,
  updatedAt: receipt.updatedAt
});

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatCurrencyPhp = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.00";
  return numeric.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const sendReceiptEmail = async (receipt) => {
  const subject = `Payment Receipt ${receipt.receiptNumber}`;
  const safeReceiptNumber = escapeHtml(receipt.receiptNumber);
  const safeStudentName = escapeHtml(receipt.studentName);
  const safePaymentDescription = escapeHtml(receipt.paymentDescription);
  const sentAtText = new Date(receipt.paymentDate).toLocaleString("en-PH");
  const safeSentAtText = escapeHtml(sentAtText);
  const text = [
    "Payment Receipt",
    "",
    `Receipt Number: ${receipt.receiptNumber}`,
    `Student: ${receipt.studentName}`,
    `Amount: PHP ${formatCurrencyPhp(receipt.amount)}`,
    `Payment For: ${receipt.paymentDescription}`,
    `Date: ${sentAtText}`
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0F2854; line-height: 1.5;">
      <h2 style="margin: 0 0 8px;">Payment Receipt</h2>
      <p style="margin: 0 0 12px;">Your payment receipt details are below.</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
        <tr>
          <td style="padding: 6px 0; font-weight: 700;">Receipt Number</td>
          <td style="padding: 6px 0;">${safeReceiptNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 700;">Student</td>
          <td style="padding: 6px 0;">${safeStudentName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 700;">Amount</td>
          <td style="padding: 6px 0;">PHP ${formatCurrencyPhp(receipt.amount)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 700;">Payment For</td>
          <td style="padding: 6px 0;">${safePaymentDescription}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 700;">Date</td>
          <td style="padding: 6px 0;">${safeSentAtText}</td>
        </tr>
      </table>
    </div>
  `;

  const delivery = await sendMail(receipt.sentTo, subject, html, { html: true, text });
  return delivery;
};

const normalizeRecipientList = (list) =>
  Array.isArray(list) ? list.map((item) => toStringValue(item).toLowerCase()).filter(Boolean) : [];

const validateEmailDelivery = (delivery, expectedRecipient) => {
  const accepted = normalizeRecipientList(delivery?.accepted);
  const rejected = normalizeRecipientList(delivery?.rejected);
  const acceptedRecipient = accepted.includes(expectedRecipient);

  if (!acceptedRecipient || rejected.includes(expectedRecipient)) {
    throw new Error(
      `Recipient not accepted by SMTP server. Accepted: [${accepted.join(", ")}], Rejected: [${rejected.join(", ")}]`
    );
  }

  return {
    messageId: toStringValue(delivery?.messageId),
    envelopeFrom: toStringValue(delivery?.envelope?.from),
    accepted,
    rejected,
    response: toStringValue(delivery?.response)
  };
};

const toMailErrorMessage = (error) => {
  const rawMessage = toStringValue(error?.message || error);
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("application-specific password required")) {
    return "Gmail requires an App Password. Update EMAIL_PASS with the App Password for schoolpaymentfeesystem@gmail.com.";
  }

  if (
    normalized.includes("badcredentials") ||
    normalized.includes("invalid login") ||
    normalized.includes("username and password not accepted")
  ) {
    return "Invalid Gmail credentials. Check EMAIL_USER and EMAIL_PASS for schoolpaymentfeesystem@gmail.com.";
  }

  return rawMessage || "SMTP error";
};

const buildReceiptQuery = ({ parentLookup, emailLookup, statusLookup }) => {
  const orClauses = [];
  const normalizedParent = toStringValue(parentLookup);
  const normalizedEmail = toStringValue(emailLookup).toLowerCase();
  const normalizedStatus = toStringValue(statusLookup).toLowerCase();

  if (mongoose.Types.ObjectId.isValid(normalizedParent)) {
    orClauses.push({ parentUserId: normalizedParent });
  }

  if (EMAIL_REGEX.test(normalizedEmail)) {
    orClauses.push({ sentTo: normalizedEmail });
  }

  if (orClauses.length === 0) {
    return { error: "A valid parent ID or email is required to fetch receipts" };
  }

  const query = { $or: orClauses };
  if (normalizedStatus && !ALLOWED_STATUSES.includes(normalizedStatus)) {
    return { error: "Invalid receipt status filter" };
  }

  if (normalizedStatus) {
    query.status = normalizedStatus;
  }

  return { query };
};

const createReceiptRecord = async ({
  receiptNumberInput,
  parentUserIdInput,
  studentUserIdInput,
  studentNameInput,
  amountInput,
  paymentDescriptionInput,
  sentToInput,
  sentViaInput,
  statusInput
}) => {
  const receiptNumber = toStringValue(receiptNumberInput);
  const parentUserId = toStringValue(parentUserIdInput);
  const studentUserId = toStringValue(studentUserIdInput) || null;
  const studentNameRaw = toStringValue(studentNameInput);
  const amount = Number(amountInput);
  const paymentDescription = toStringValue(paymentDescriptionInput);
  const sentVia = normalizeSentVia(sentViaInput);
  const sentToRaw = toStringValue(sentToInput);
  const sentTo = sentVia === "email" ? sentToRaw.toLowerCase() : sentToRaw;
  const status = normalizeReceiptStatus(statusInput);

  if (!receiptNumber || !studentNameRaw || Number.isNaN(amount) || !paymentDescription || !sentTo) {
    return {
      error: "receiptNumber, studentName, amount, paymentDescription, and sentTo are required",
      status: 400
    };
  }

  if (amount <= 0) {
    return {
      error: "amount must be greater than 0",
      status: 400
    };
  }

  if (sentVia === "email" && !EMAIL_REGEX.test(sentTo)) {
    return {
      error: "sentTo must be a valid email",
      status: 400
    };
  }

  if (sentVia === "sms" && !PHONE_REGEX.test(sentTo)) {
    return {
      error: "sentTo must be a valid phone number",
      status: 400
    };
  }

  let resolvedParentUserId = parentUserId;
  if (resolvedParentUserId && !mongoose.Types.ObjectId.isValid(resolvedParentUserId)) {
    return {
      error: "parentUserId must be a valid ObjectId",
      status: 400
    };
  }

  if (!resolvedParentUserId && sentVia === "email" && EMAIL_REGEX.test(sentTo)) {
    const parentByEmail = await User.findOne({ email: sentTo, userType: "parent" }).lean();
    resolvedParentUserId = parentByEmail ? String(parentByEmail._id) : "";
  }

  if (resolvedParentUserId && mongoose.Types.ObjectId.isValid(resolvedParentUserId)) {
    const parentUser = await User.findById(resolvedParentUserId).lean();
    if (!parentUser || parentUser.userType !== "parent") {
      return {
        error: "Parent account not found",
        status: 404
      };
    }
  }

  let finalStudentName = studentNameRaw;
  if (studentUserId && mongoose.Types.ObjectId.isValid(studentUserId)) {
    const student = await Student.findOne({ userId: studentUserId }).lean();
    if (student) {
      const fullName = [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      finalStudentName = fullName || studentNameRaw;
    }
  }

  const receipt = await Receipt.create({
    receiptNumber,
    parentUserId: resolvedParentUserId && mongoose.Types.ObjectId.isValid(resolvedParentUserId)
      ? resolvedParentUserId
      : null,
    studentUserId: studentUserId && mongoose.Types.ObjectId.isValid(studentUserId) ? studentUserId : null,
    studentName: finalStudentName,
    amount,
    paymentDescription,
    sentVia,
    sentTo,
    paymentDate: new Date(),
    status
  });

  return { receipt };
};

const getReceiptsByParent = async (req, res) => {
  try {
    const parentUserId = toStringValue(req.params.parentUserId);
    const email = toStringValue(req.query?.email);
    const status = toStringValue(req.query?.status);
    const { query, error } = buildReceiptQuery({
      parentLookup: parentUserId,
      emailLookup: email,
      statusLookup: status
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error
      });
    }

    const receipts = await Receipt.find(query)
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      receipts: receipts.map(serializeReceipt)
    });
  } catch (error) {
    console.error("Get parent receipts error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const getAllReceipts = async (_req, res) => {
  try {
    const parentUserId = toStringValue(_req.query?.parentUserId);
    const email = toStringValue(_req.query?.email);
    const status = toStringValue(_req.query?.status);
    let query = {};

    if (status && !parentUserId && !email) {
      const normalizedStatus = toStringValue(status).toLowerCase();
      if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid receipt status filter"
        });
      }

      query = { status: normalizedStatus };
    } else if (parentUserId || email || status) {
      const built = buildReceiptQuery({
        parentLookup: parentUserId,
        emailLookup: email,
        statusLookup: status
      });

      if (built.error) {
        return res.status(400).json({
          success: false,
          message: built.error
        });
      } else {
        query = built.query;
      }
    }

    const receipts = await Receipt.find(query)
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      receipts: receipts.map(serializeReceipt)
    });
  } catch (error) {
    console.error("Get all receipts error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const clearReceipts = async (req, res) => {
  try {
    const status = toStringValue(req.query?.status).toLowerCase();
    const sentVia = toStringValue(req.query?.sentVia).toLowerCase();
    const query = {};

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid receipt status filter"
        });
      }
      query.status = status;
    }

    if (sentVia) {
      if (!ALLOWED_CHANNELS.includes(sentVia)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sentVia filter"
        });
      }
      query.sentVia = sentVia;
    }

    const result = await Receipt.deleteMany(query);
    const deletedCount = Number(result?.deletedCount || 0);

    return res.status(200).json({
      success: true,
      message: deletedCount > 0
        ? `Cleared ${deletedCount} receipt${deletedCount === 1 ? "" : "s"}`
        : "No receipts to clear",
      deletedCount
    });
  } catch (error) {
    console.error("Clear receipts error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const createManualReceipt = async (req, res) => {
  try {
    const created = await createReceiptRecord({
      receiptNumberInput: req.body?.receiptNumber,
      parentUserIdInput: req.body?.parentUserId,
      studentUserIdInput: req.body?.studentUserId,
      studentNameInput: req.body?.studentName,
      amountInput: req.body?.amount,
      paymentDescriptionInput: req.body?.paymentDescription,
      sentToInput: req.body?.sentTo,
      sentViaInput: req.body?.sentVia,
      statusInput: req.body?.status
    });

    if (created.error) {
      return res.status(created.status || 400).json({
        success: false,
        message: created.error
      });
    }

    let deliveryInfo = null;
    if (created.receipt.sentVia === "email") {
      try {
        const delivery = await sendReceiptEmail(created.receipt);
        const expectedRecipient = toStringValue(created.receipt.sentTo).toLowerCase();
        deliveryInfo = validateEmailDelivery(delivery, expectedRecipient);
      } catch (mailError) {
        await Receipt.findByIdAndDelete(created.receipt._id);
        return res.status(502).json({
          success: false,
          message: `Failed to send email receipt: ${toMailErrorMessage(mailError)}`
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: created.receipt.sentVia === "email"
        ? "Manual receipt sent successfully via email"
        : "Manual receipt added successfully",
      receipt: serializeReceipt(created.receipt),
      delivery: deliveryInfo
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.receiptNumber) {
      return res.status(409).json({
        success: false,
        message: "Receipt number already exists"
      });
    }

    console.error("Create manual receipt error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const createSentReceipt = async (req, res) => {
  try {
    const created = await createReceiptRecord({
      receiptNumberInput: req.body?.receiptNumber,
      parentUserIdInput: req.body?.parentUserId,
      studentUserIdInput: req.body?.studentUserId,
      studentNameInput: req.body?.studentName,
      amountInput: req.body?.amount,
      paymentDescriptionInput: req.body?.paymentDescription,
      sentToInput: req.body?.sentTo,
      sentViaInput: req.body?.sentVia,
      statusInput: req.body?.status
    });

    if (created.error) {
      return res.status(created.status || 400).json({
        success: false,
        message: created.error
      });
    }

    return res.status(201).json({
      success: true,
      message: "Sent receipt stored successfully",
      receipt: serializeReceipt(created.receipt)
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.receiptNumber) {
      return res.status(409).json({
        success: false,
        message: "Receipt number already exists"
      });
    }

    console.error("Create sent receipt error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

const resendReceipt = async (req, res) => {
  try {
    const receiptId = toStringValue(req.params?.id);
    if (!mongoose.Types.ObjectId.isValid(receiptId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receipt ID"
      });
    }

    const receipt = await Receipt.findById(receiptId);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found"
      });
    }

    if (receipt.sentVia !== "email") {
      return res.status(400).json({
        success: false,
        message: "Resend currently supports email receipts only"
      });
    }

    try {
      const delivery = await sendReceiptEmail(receipt);
      const expectedRecipient = toStringValue(receipt.sentTo).toLowerCase();
      const deliveryInfo = validateEmailDelivery(delivery, expectedRecipient);

      receipt.status = "sent";
      await receipt.save();

      return res.status(200).json({
        success: true,
        message: "Receipt resent successfully via email",
        receipt: serializeReceipt(receipt),
        delivery: deliveryInfo
      });
    } catch (mailError) {
      return res.status(502).json({
        success: false,
        message: `Failed to resend email receipt: ${toMailErrorMessage(mailError)}`
      });
    }
  } catch (error) {
    console.error("Resend receipt error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  getAllReceipts,
  getReceiptsByParent,
  clearReceipts,
  createManualReceipt,
  createSentReceipt,
  resendReceipt
};
