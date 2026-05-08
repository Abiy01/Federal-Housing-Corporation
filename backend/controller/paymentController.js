import fs from "fs";
import Payment from "../models/paymentModel.js";
import TransactionRequest from "../models/transactionRequestModel.js";
import Property from "../models/propertyModel.js";
import RentLease from "../models/rentLeaseModel.js";
import RentDue from "../models/rentDueModel.js";
import userModel from "../models/userModel.js";
import { uploadLocalImage } from "../config/cloudinary.js";
import logger from "../utils/logger.js";
import { createNotification } from "./notificationController.js";

const paymentPopulate = [
  {
    path: "transaction",
    select: "requestType status createdAt decidedAt property requestedBy",
    populate: [
      { path: "property", select: "title location price image availability" },
      { path: "requestedBy", select: "name email" },
    ],
  },
  { path: "user", select: "name email" },
  { path: "property", select: "title location price image availability" },
];

const paymentMethodConfig = () => ({
  telebirrNumber: process.env.TELEBIRR_NUMBER || "",
  cbebirrNumber: process.env.CBE_BIRR_NUMBER || "",
  cbeAccountNumber: process.env.CBE_ACCOUNT_NUMBER || "",
});

export const getPaymentMethods = async (_req, res) => {
  return res.json({
    success: true,
    methods: paymentMethodConfig(),
  });
};

export const createPayment = async (req, res) => {
  try {
    const { propertyId, requestType, method, reference } = req.body;
    const purpose = req.body.purpose || "request_payment";
    const leaseId = req.body.leaseId || null;
    const rentDueId = req.body.rentDueId || null;
    if (!propertyId || !requestType || !method || !reference) {
      return res.status(400).json({
        success: false,
        message: "propertyId, requestType, method and reference are required",
      });
    }
    if (!["rent", "buy"].includes(requestType)) {
      return res.status(400).json({ success: false, message: "requestType must be rent or buy" });
    }
    if (!["telebirr", "cbebirr", "cbe"].includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be telebirr, cbebirr, or cbe",
      });
    }
    const fileGroups = req.files || {};
    const receiptFile = Array.isArray(fileGroups.receipt) ? fileGroups.receipt[0] : null;
    const contractFile = Array.isArray(fileGroups.contract) ? fileGroups.contract[0] : null;
    if (!receiptFile) {
      return res.status(400).json({ success: false, message: "Receipt image is required" });
    }
    if (purpose === "request_payment" && !contractFile) {
      return res.status(400).json({
        success: false,
        message: "A clear scanned contract image is required",
      });
    }

    const property = await Property.findById(propertyId).select("title location price availability status");
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const existingPendingOrApproved = await Payment.findOne({
      user: req.user._id,
      property: propertyId,
      requestType,
      status: { $in: ["pending", "successful"] },
      transaction: null,
    });
    if (existingPendingOrApproved) {
      return res.status(400).json({
        success: false,
        message: "A payment proof is already submitted for this request",
      });
    }

    const amount = typeof property.price === "number" && !Number.isNaN(property.price) ? property.price : 0;
    const receiptUrl = await uploadLocalImage(receiptFile.path, "PaymentReceipts");
    fs.unlink(receiptFile.path, () => {});
    const contractUrl = contractFile
      ? await uploadLocalImage(contractFile.path, "PaymentContracts")
      : "";
    if (contractFile?.path) fs.unlink(contractFile.path, () => {});

    const payment = await Payment.create({
      user: req.user._id,
      property: propertyId,
      requestType,
      purpose,
      lease: leaseId,
      rentDue: rentDueId,
      method,
      reference: String(reference).trim(),
      receiptUrl,
      contractUrl,
      amount,
      status: "pending",
      submittedAt: new Date(),
      paidAt: null,
    });

    const populated = await Payment.findById(payment._id).populate(paymentPopulate);
    const financeUsers = await userModel.find({ role: "finance", status: "active" }).select("_id");
    await Promise.all(
      financeUsers.map((financeUser) =>
        createNotification({
          user: financeUser._id,
          title: "Payment audit pending",
          message: `A new ${requestType} payment proof is pending finance audit.`,
          type: "general",
          metadata: { paymentId: payment._id },
        })
      )
    );
    return res.status(201).json({ success: true, payment: populated });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This payment reference is already used",
      });
    }
    logger.error("createPayment", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Failed to create payment" });
  }
};

export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate(paymentPopulate);
    return res.json({ success: true, payments });
  } catch (error) {
    logger.error("getMyPayments", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load payments" });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const { status, method } = req.query;
    const query = {};
    if (status && status !== "all") query.status = status;
    if (method && method !== "all") query.method = method;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .populate(paymentPopulate);
    return res.json({ success: true, payments });
  } catch (error) {
    logger.error("getAllPayments", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load payments" });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body || {};
    if (!["pending", "successful", "failed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use pending, successful, or failed",
      });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    payment.status = status;
    payment.note = note ? String(note).trim() : payment.note;
    payment.paidAt = status === "successful" ? new Date() : null;
    await payment.save();

    if (payment.transaction) {
      const tx = await TransactionRequest.findById(payment.transaction).populate({
        path: "property",
        select: "status price",
      });
      if (tx) {
        if (status === "successful") {
          tx.status = "approved";
          tx.transactionValue =
            typeof payment.amount === "number"
              ? payment.amount
              : typeof tx.property?.price === "number"
                ? tx.property.price
                : tx.transactionValue;
          tx.decidedAt = new Date();
          tx.decidedBy = req.admin?.email || "admin";
          tx.decisionNote = payment.note || tx.decisionNote || "Payment proof approved";
          await tx.save();

          if (tx.requestType === "rent") {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            const nextDueDate = new Date(endDate);

            let lease = await RentLease.findOne({ transaction: tx._id });
            if (!lease) {
              lease = await RentLease.create({
                user: tx.requestedBy,
                property: tx.property?._id,
                transaction: tx._id,
                status: "active",
                startDate,
                endDate,
                nextDueDate,
                monthlyRent: tx.transactionValue || payment.amount || 0,
              });
            }
            const existingDue = await RentDue.findOne({ lease: lease._id, dueDate: lease.nextDueDate });
            if (!existingDue) {
              await RentDue.create({
                lease: lease._id,
                user: lease.user,
                property: lease.property,
                amount: lease.monthlyRent,
                dueDate: lease.nextDueDate,
                status: "pending",
              });
            }
          }

          if (tx.property && ["rented", "sold"].indexOf(tx.property.status) === -1) {
            tx.property.status = tx.requestType === "rent" ? "rented" : "sold";
            await tx.property.save();
          }
        }
        if (status === "failed") {
          tx.status = "rejected";
          tx.decidedAt = new Date();
          tx.decidedBy = req.admin?.email || "admin";
          tx.decisionNote = payment.note || "Payment proof rejected";
          await tx.save();
        }
      }
    }

    const populated = await Payment.findById(payment._id).populate(paymentPopulate);
    return res.json({ success: true, payment: populated });
  } catch (error) {
    logger.error("updatePaymentStatus", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to update payment status" });
  }
};
