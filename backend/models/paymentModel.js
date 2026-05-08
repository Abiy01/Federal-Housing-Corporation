import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransactionRequest",
      default: null,
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ["rent", "buy"],
      required: true,
    },
    purpose: {
      type: String,
      enum: ["request_payment", "lease_renewal", "rent_due"],
      default: "request_payment",
      index: true,
    },
    lease: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentLease",
      default: null,
      index: true,
    },
    rentDue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentDue",
      default: null,
      index: true,
    },
    method: {
      type: String,
      enum: ["telebirr", "cbebirr", "cbe"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
    },
    receiptUrl: {
      type: String,
      required: true,
      trim: true,
    },
    contractUrl: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "successful", "failed"],
      default: "pending",
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
      index: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    auditStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    auditReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    auditReviewedAt: {
      type: Date,
      default: null,
    },
    auditNote: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ transaction: 1, status: 1 });
paymentSchema.index({ user: 1, property: 1, requestType: 1, status: 1 });
paymentSchema.index({ reference: 1 }, { unique: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
