const Notification = require("../models/notificationModel");

const toStringValue = (value) => String(value || "").trim();

const serializeNotification = (notification) => {
  const method = toStringValue(notification.method).toLowerCase();
  const rawStatus = toStringValue(notification.status).toLowerCase();
  const normalizedStatus = rawStatus === "sent" ? "sent" : "pending";

  return {
    id: String(notification._id),
    recipient: toStringValue(notification.recipient),
    message: toStringValue(notification.message),
    method: method === "sms" ? "sms" : "email",
    status: normalizedStatus,
    timestamp: notification.sentAt || notification.createdAt
  };
};

const getNotifications = async (req, res) => {
  try {
    const method = toStringValue(req.query?.method).toLowerCase();
    const status = toStringValue(req.query?.status).toLowerCase();

    const query = {};

    if (["sms", "email"].includes(method)) {
      query.method = method;
    }

    if (["sent", "pending", "failed"].includes(status)) {
      query.status = status;
    }

    const notifications = await Notification.find(query)
      .sort({ sentAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      notifications: notifications.map(serializeNotification)
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  getNotifications
};
