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

const buildNotificationQuery = (req) => {
  const method = toStringValue(req.query?.method).toLowerCase();
  const status = toStringValue(req.query?.status).toLowerCase();
  const query = {};

  if (["sms", "email"].includes(method)) {
    query.method = method;
  }

  if (["sent", "pending", "failed"].includes(status)) {
    query.status = status;
  }

  return query;
};

const getNotifications = async (req, res) => {
  try {
    const query = buildNotificationQuery(req);

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

const clearNotifications = async (req, res) => {
  try {
    const query = buildNotificationQuery(req);
    const result = await Notification.deleteMany(query);
    const deletedCount = Number(result?.deletedCount || 0);

    return res.status(200).json({
      success: true,
      message: deletedCount > 0
        ? `Cleared ${deletedCount} notification${deletedCount === 1 ? "" : "s"}`
        : "No notifications to clear",
      deletedCount
    });
  } catch (error) {
    console.error("Clear notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = {
  getNotifications,
  clearNotifications
};
