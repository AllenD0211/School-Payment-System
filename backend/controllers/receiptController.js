const Receipt = require("../models/receiptModel");
const User = require("../models/userModel");
const Student = require("../models/studentModel");
const mongoose = require("mongoose");

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

    return res.status(201).json({
      success: true,
      message: "Manual receipt added successfully",
      receipt: serializeReceipt(created.receipt)
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

module.exports = {
  getAllReceipts,
  getReceiptsByParent,
  createManualReceipt,
  createSentReceipt
};
