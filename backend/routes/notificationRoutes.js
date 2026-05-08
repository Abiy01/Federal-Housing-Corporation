import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controller/notificationController.js";

const router = express.Router();

router.get("/my", protect, getMyNotifications);
router.put("/:id/read", protect, markNotificationRead);
router.put("/read-all", protect, markAllNotificationsRead);

export default router;

