import Payment from "../models/paymentModel.js";
import RentLease from "../models/rentLeaseModel.js";
import TransactionRequest from "../models/transactionRequestModel.js";
import logger from "../utils/logger.js";
import { createNotification } from "./notificationController.js";

export const getFinanceAuditSummary = async (_req, res) => {
  try {
    const [pendingPayments, pendingLeases, pendingTransactions] = await Promise.all([
      Payment.countDocuments({ auditStatus: "pending" }),
      RentLease.countDocuments({ auditStatus: "pending" }),
      TransactionRequest.countDocuments({ auditStatus: "pending" }),
    ]);
    return res.json({
      success: true,
      summary: {
        pendingPayments,
        pendingLeases,
        pendingTransactions,
      },
    });
  } catch (error) {
    logger.error("getFinanceAuditSummary", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load finance audit summary" });
  }
};

export const getFinancePayments = async (req, res) => {
  try {
    const auditStatus = req.query.auditStatus;
    const query = {};
    if (auditStatus && auditStatus !== "all") query.auditStatus = auditStatus;
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("property", "title location");
    return res.json({ success: true, payments });
  } catch (error) {
    logger.error("getFinancePayments", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load payment audits" });
  }
};

export const reviewFinancePayment = async (req, res) => {
  try {
    const { auditStatus, note } = req.body || {};
    if (!["approved", "rejected"].includes(auditStatus)) {
      return res.status(400).json({ success: false, message: "auditStatus must be approved or rejected" });
    }
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    payment.auditStatus = auditStatus;
    payment.auditNote = note ? String(note).trim() : "";
    payment.auditReviewedAt = new Date();
    payment.auditReviewedBy = req.user._id;
    await payment.save();
    await createNotification({
      user: payment.user,
      title: "Payment audit update",
      message: `Finance marked your payment audit as ${auditStatus}.`,
      type: "general",
      metadata: { paymentId: payment._id },
    });
    return res.json({ success: true, payment });
  } catch (error) {
    logger.error("reviewFinancePayment", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to review payment audit" });
  }
};

export const getFinanceLeases = async (req, res) => {
  try {
    const auditStatus = req.query.auditStatus;
    const query = {};
    if (auditStatus && auditStatus !== "all") query.auditStatus = auditStatus;
    const leases = await RentLease.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("property", "title location");
    return res.json({ success: true, leases });
  } catch (error) {
    logger.error("getFinanceLeases", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load lease audits" });
  }
};

export const reviewFinanceLease = async (req, res) => {
  try {
    const { auditStatus, note } = req.body || {};
    if (!["approved", "rejected"].includes(auditStatus)) {
      return res.status(400).json({ success: false, message: "auditStatus must be approved or rejected" });
    }
    const lease = await RentLease.findById(req.params.id);
    if (!lease) return res.status(404).json({ success: false, message: "Lease not found" });
    lease.auditStatus = auditStatus;
    lease.auditNote = note ? String(note).trim() : "";
    lease.auditReviewedAt = new Date();
    lease.auditReviewedBy = req.user._id;
    await lease.save();
    await createNotification({
      user: lease.user,
      title: "Lease audit update",
      message: `Finance marked your lease audit as ${auditStatus}.`,
      type: "general",
      metadata: { leaseId: lease._id },
    });
    return res.json({ success: true, lease });
  } catch (error) {
    logger.error("reviewFinanceLease", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to review lease audit" });
  }
};

export const getFinanceTransactions = async (req, res) => {
  try {
    const auditStatus = req.query.auditStatus;
    const query = {};
    if (auditStatus && auditStatus !== "all") query.auditStatus = auditStatus;
    const transactions = await TransactionRequest.find(query)
      .sort({ createdAt: -1 })
      .populate("requestedBy", "name email")
      .populate("property", "title location");
    return res.json({ success: true, transactions });
  } catch (error) {
    logger.error("getFinanceTransactions", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load transaction audits" });
  }
};

export const reviewFinanceTransaction = async (req, res) => {
  try {
    const { auditStatus, note } = req.body || {};
    if (!["approved", "rejected"].includes(auditStatus)) {
      return res.status(400).json({ success: false, message: "auditStatus must be approved or rejected" });
    }
    const transaction = await TransactionRequest.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });
    transaction.auditStatus = auditStatus;
    transaction.auditNote = note ? String(note).trim() : "";
    transaction.auditReviewedAt = new Date();
    transaction.auditReviewedBy = req.user._id;
    await transaction.save();
    await createNotification({
      user: transaction.requestedBy,
      title: "Transaction audit update",
      message: `Finance marked your transaction audit as ${auditStatus}.`,
      type: "general",
      metadata: { transactionId: transaction._id },
    });
    return res.json({ success: true, transaction });
  } catch (error) {
    logger.error("reviewFinanceTransaction", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to review transaction audit" });
  }
};
