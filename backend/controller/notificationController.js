import Notification from "../models/notificationModel.js";
import logger from "../utils/logger.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    return res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    logger.error("getMyNotifications", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    return res.json({ success: true, notification });
  } catch (error) {
    logger.error("markNotificationRead", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to mark notification as read" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    return res.json({ success: true });
  } catch (error) {
    logger.error("markAllNotificationsRead", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to mark all notifications as read" });
  }
};

export const createNotification = async ({ user, title, message, type = "general", metadata = {} }) => {
  try {
    await Notification.create({ user, title, message, type, metadata });
  } catch (error) {
    logger.error("createNotification", { error: error.message, user });
  }
};

