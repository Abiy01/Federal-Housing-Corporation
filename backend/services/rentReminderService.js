import RentLease from "../models/rentLeaseModel.js";
import RentDue from "../models/rentDueModel.js";
import { createNotification } from "../controller/notificationController.js";
import emailService from "./emailService.js";
import userModel from "../models/userModel.js";
import logger from "../utils/logger.js";

const dayMs = 24 * 60 * 60 * 1000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const runRentReminderCycle = async () => {
  const now = new Date();
  const today = startOfDay(now);
  const in3Days = new Date(today.getTime() + 3 * dayMs);

  const dues = await RentDue.find({ status: { $in: ["pending", "overdue"] } }).populate("lease");
  for (const due of dues) {
    const lease = due.lease;
    if (!lease || lease.status !== "active") continue;
    const dueDay = startOfDay(new Date(due.dueDate));
    const user = await userModel.findById(due.user).select("email name");
    if (!user) continue;

    if (dueDay.getTime() === in3Days.getTime() && !lease.lastReminder3dAt) {
      await createNotification({
        user: due.user,
        type: "rent_due_reminder",
        title: "Rent due in 3 days",
        message: `Your monthly rent payment is due on ${dueDay.toLocaleDateString()}.`,
        metadata: { dueId: due._id, leaseId: lease._id },
      });
      await emailService.sendEmailSafely(
        user.email,
        "BuildEstate: Rent due in 3 days",
        `<p>Hello ${user.name || "there"}, your rent is due on ${dueDay.toLocaleDateString()}.</p>`
      );
      lease.lastReminder3dAt = now;
      await lease.save();
    }

    if (dueDay.getTime() === today.getTime() && !lease.lastReminderDueDayAt) {
      await createNotification({
        user: due.user,
        type: "rent_due_reminder",
        title: "Rent due today",
        message: "Your monthly rent is due today.",
        metadata: { dueId: due._id, leaseId: lease._id },
      });
      await emailService.sendEmailSafely(
        user.email,
        "BuildEstate: Rent due today",
        `<p>Hello ${user.name || "there"}, your rent is due today.</p>`
      );
      lease.lastReminderDueDayAt = now;
      await lease.save();
    }
  }
};

let reminderInterval = null;
export const startRentReminderJob = () => {
  if (reminderInterval) return;
  runRentReminderCycle().catch((error) => logger.error("runRentReminderCycle", { error: error.message }));
  reminderInterval = setInterval(() => {
    runRentReminderCycle().catch((error) => logger.error("runRentReminderCycle", { error: error.message }));
  }, dayMs);
};

