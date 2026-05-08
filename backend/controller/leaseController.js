import fs from "fs";
import RentLease from "../models/rentLeaseModel.js";
import RentDue from "../models/rentDueModel.js";
import Payment from "../models/paymentModel.js";
import userModel from "../models/userModel.js";
import Property from "../models/propertyModel.js";
import { uploadLocalImage } from "../config/cloudinary.js";
import logger from "../utils/logger.js";
import { createNotification } from "./notificationController.js";

export const getMyLeases = async (req, res) => {
  try {
    const leases = await RentLease.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("property", "title location image")
      .populate("transaction", "requestType status createdAt");
    return res.json({ success: true, leases });
  } catch (error) {
    logger.error("getMyLeases", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load leases" });
  }
};

export const getMyLeaseDues = async (req, res) => {
  try {
    const dues = await RentDue.find({ user: req.user._id })
      .sort({ dueDate: -1 })
      .populate("lease", "status")
      .populate("property", "title location");
    return res.json({ success: true, dues });
  } catch (error) {
    logger.error("getMyLeaseDues", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load lease dues" });
  }
};

export const requestLeaseRenewal = async (req, res) => {
  try {
    const { leaseId, method, reference } = req.body;
    if (!leaseId || !method || !reference) {
      return res.status(400).json({ success: false, message: "leaseId, method and reference are required" });
    }
    const lease = await RentLease.findOne({ _id: leaseId, user: req.user._id }).populate("property", "price");
    if (!lease) return res.status(404).json({ success: false, message: "Lease not found" });
    if (lease.status === "ended") {
      return res.status(400).json({ success: false, message: "Cannot renew ended lease" });
    }
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ success: false, message: "Receipt image is required" });
    const receiptUrl = await uploadLocalImage(files[0].path, "PaymentReceipts");
    fs.unlink(files[0].path, () => {});

    const payment = await Payment.create({
      user: req.user._id,
      property: lease.property._id,
      requestType: "rent",
      purpose: "lease_renewal",
      lease: lease._id,
      method,
      reference: String(reference).trim(),
      receiptUrl,
      amount: lease.monthlyRent || lease.property?.price || 0,
      status: "pending",
      submittedAt: new Date(),
    });

    lease.status = "renewal_pending";
    lease.auditStatus = "pending";
    await lease.save();
    const financeUsers = await userModel.find({ role: "finance", status: "active" }).select("_id");
    await Promise.all(
      financeUsers.map((financeUser) =>
        createNotification({
          user: financeUser._id,
          title: "Lease renewal audit pending",
          message: "A lease renewal request is pending finance audit.",
          type: "general",
          metadata: { leaseId: lease._id },
        })
      )
    );
    return res.status(201).json({ success: true, payment, lease });
  } catch (error) {
    logger.error("requestLeaseRenewal", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to submit renewal request" });
  }
};

export const requestEndContract = async (req, res) => {
  try {
    const { leaseId, note } = req.body;
    const lease = await RentLease.findOne({ _id: leaseId, user: req.user._id });
    if (!lease) return res.status(404).json({ success: false, message: "Lease not found" });
    if (lease.status === "ended") return res.status(400).json({ success: false, message: "Lease already ended" });
    lease.status = "ending_pending";
    lease.auditStatus = "pending";
    lease.endRequestNote = note ? String(note).trim() : "";
    lease.endRequestedAt = new Date();
    await lease.save();
    const financeUsers = await userModel.find({ role: "finance", status: "active" }).select("_id");
    await Promise.all(
      financeUsers.map((financeUser) =>
        createNotification({
          user: financeUser._id,
          title: "Lease ending audit pending",
          message: "A lease ending request is pending finance audit.",
          type: "general",
          metadata: { leaseId: lease._id },
        })
      )
    );
    return res.json({ success: true, lease });
  } catch (error) {
    logger.error("requestEndContract", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to submit end request" });
  }
};

export const getAllLeases = async (_req, res) => {
  try {
    const leases = await RentLease.find({})
      .sort({ createdAt: -1 })
      .populate("property", "title location")
      .populate("user", "name email");
    return res.json({ success: true, leases });
  } catch (error) {
    logger.error("getAllLeases", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load leases" });
  }
};

export const updateLeaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body || {};
    const lease = await RentLease.findById(id);
    if (!lease) return res.status(404).json({ success: false, message: "Lease not found" });
    const property = await Property.findById(lease.property);
    if (action === "approve_end") {
      lease.status = "ended";
      // Make previously rented property visible on the public marketplace again.
      if (property && property.status === "rented") {
        property.status = "active";
        await property.save();
      }
    }
    if (action === "reject_end") {
      lease.status = "active";
      // End request rejected means lease continues; keep property unavailable publicly.
      if (property && property.status === "active") {
        property.status = "rented";
        await property.save();
      }
    }
    if (action === "approve_renewal") {
      lease.status = "active";
      lease.endDate = new Date(new Date(lease.endDate).setMonth(new Date(lease.endDate).getMonth() + 1));
      lease.nextDueDate = new Date(new Date(lease.nextDueDate).setMonth(new Date(lease.nextDueDate).getMonth() + 1));
      await RentDue.create({
        lease: lease._id,
        user: lease.user,
        property: lease.property,
        amount: lease.monthlyRent,
        dueDate: lease.nextDueDate,
        status: "pending",
      });
    }
    if (action === "reject_renewal") lease.status = "active";
    if (note) lease.endRequestNote = String(note).trim();
    await lease.save();
    return res.json({ success: true, lease });
  } catch (error) {
    logger.error("updateLeaseStatus", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to update lease status" });
  }
};

