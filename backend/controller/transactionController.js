import mongoose from "mongoose";
import TransactionRequest from "../models/transactionRequestModel.js";
import Property from "../models/propertyModel.js";
import Payment from "../models/paymentModel.js";
import userModel from "../models/userModel.js";
import logger from "../utils/logger.js";
import { createNotification } from "./notificationController.js";

const populateTransaction = [
  { path: "property", select: "title location price status image availability" },
  { path: "requestedBy", select: "name email" },
];

const ACTIVE_TRANSACTION_STATUSES = ["pending", "approved"];

/** Aligns with admin `rent`/`buy`, user portal `For Rent`/`For Sale`, and filters. */
const allowedRequestTypesForAvailability = (availability) => {
  if (availability == null || availability === "") return ["rent", "buy"];
  const a = String(availability).toLowerCase().trim();
  if (a === "rent" || a.includes("for rent")) return ["rent"];
  if (a === "buy" || a === "sale" || a.includes("for sale")) return ["buy"];
  return ["rent", "buy"];
};

export const createTransactionRequest = async (req, res) => {
  try {
    const { propertyId, requestType, message, paymentId } = req.body;

    if (!propertyId || !requestType || !paymentId || !["rent", "buy"].includes(requestType)) {
      return res.status(400).json({
        success: false,
        message: "propertyId, paymentId and valid requestType (rent|buy) are required",
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const allowedTypes = allowedRequestTypesForAvailability(property.availability);
    if (!allowedTypes.includes(requestType)) {
      return res.status(400).json({
        success: false,
        message:
          requestType === "rent"
            ? "This listing is not offered for rent."
            : "This listing is not offered for sale.",
      });
    }

    if (["rented", "sold"].includes(property.status)) {
      return res.status(400).json({
        success: false,
        message: "This property has already been transacted",
      });
    }

    if (!property.status || property.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This property is not available for transactions",
      });
    }

    const activeRequest = await TransactionRequest.findOne({
      property: propertyId,
      status: { $in: ACTIVE_TRANSACTION_STATUSES },
    });
    if (activeRequest) {
      return res.status(400).json({
        success: false,
        message: "This property already has an active transaction request",
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment proof not found" });
    }
    if (String(payment.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized for this payment proof" });
    }
    if (payment.status !== "pending") {
      return res.status(400).json({ success: false, message: "Payment proof must be pending review" });
    }
    if (payment.transaction) {
      return res.status(400).json({ success: false, message: "Payment proof is already linked to a request" });
    }
    if (String(payment.property) !== String(propertyId) || payment.requestType !== requestType) {
      return res.status(400).json({ success: false, message: "Payment proof does not match this request" });
    }

    const request = await TransactionRequest.create({
      property: propertyId,
      requestedBy: req.user._id,
      requestType,
      message: message ? String(message).trim() : "",
      status: "pending",
    });

    payment.transaction = request._id;
    await payment.save();

    if (requestType === "rent") {
      property.status = "pending";
      await property.save();
    }

    const populated = await TransactionRequest.findById(request._id).populate(populateTransaction);
    const financeUsers = await userModel.find({ role: "finance", status: "active" }).select("_id");
    await Promise.all(
      financeUsers.map((financeUser) =>
        createNotification({
          user: financeUser._id,
          title: "Transaction audit pending",
          message: `A new ${requestType} transaction request is pending finance audit.`,
          type: "general",
          metadata: { transactionRequestId: request._id },
        })
      )
    );
    return res.status(201).json({ success: true, request: populated });
  } catch (error) {
    logger.error("createTransactionRequest", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Failed to create transaction request" });
  }
};

export const getMyTransactionRequests = async (req, res) => {
  try {
    const requests = await TransactionRequest.find({ requestedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate(populateTransaction);

    return res.json({ success: true, requests });
  } catch (error) {
    logger.error("getMyTransactionRequests", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load transaction requests" });
  }
};

export const getAllTransactionRequests = async (req, res) => {
  try {
    const status = req.query.status;
    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const requests = await TransactionRequest.find(query)
      .sort({ createdAt: -1 })
      .populate(populateTransaction);

    return res.json({ success: true, requests });
  } catch (error) {
    logger.error("getAllTransactionRequests", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load transaction requests" });
  }
};

export const approveTransactionRequest = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    const { note } = req.body || {};

    session.startTransaction();

    const request = await TransactionRequest.findById(id).session(session);
    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Transaction request not found" });
    }

    if (request.status !== "pending") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be approved",
      });
    }

    const property = await Property.findById(request.property).session(session);
    if (!property) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    if (["rented", "sold"].includes(property.status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Property is already rented/sold",
      });
    }

    request.status = "approved";
    request.decisionNote = note ? String(note).trim() : "";
    request.decidedBy = req.admin?.email || "admin";
    request.decidedAt = new Date();
    request.transactionValue =
      typeof property.price === "number" && !Number.isNaN(property.price) ? property.price : 0;
    await request.save({ session });

    property.status = request.requestType === "rent" ? "rented" : "sold";
    await property.save({ session });

    await TransactionRequest.updateMany(
      {
        _id: { $ne: request._id },
        property: request.property,
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
          decisionNote:
            "Auto-rejected: another transaction request was approved for this property.",
          decidedBy: req.admin?.email || "admin",
          decidedAt: new Date(),
        },
      },
      { session }
    );

    await session.commitTransaction();

    const populated = await TransactionRequest.findById(request._id).populate(populateTransaction);
    return res.json({ success: true, request: populated });
  } catch (error) {
    await session.abortTransaction();
    logger.error("approveTransactionRequest", { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: "Failed to approve request" });
  } finally {
    session.endSession();
  }
};

export const rejectTransactionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body || {};

    const request = await TransactionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Transaction request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be rejected",
      });
    }

    request.status = "rejected";
    request.decisionNote = note ? String(note).trim() : "";
    request.decidedBy = req.admin?.email || "admin";
    request.decidedAt = new Date();
    await request.save();

    if (request.requestType === "rent") {
      const competingActive = await TransactionRequest.findOne({
        _id: { $ne: request._id },
        property: request.property,
        requestType: "rent",
        status: { $in: ACTIVE_TRANSACTION_STATUSES },
      });
      if (!competingActive) {
        const property = await Property.findById(request.property);
        if (property && property.status === "pending") {
          property.status = "active";
          await property.save();
        }
      }
    }

    const populated = await TransactionRequest.findById(request._id).populate(populateTransaction);
    return res.json({ success: true, request: populated });
  } catch (error) {
    logger.error("rejectTransactionRequest", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to reject request" });
  }
};
