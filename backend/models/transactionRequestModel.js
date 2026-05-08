import mongoose from "mongoose";

const transactionRequestSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ["rent", "buy"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    decisionNote: {
      type: String,
      default: "",
      trim: true,
    },
    decidedBy: {
      type: String,
      default: "",
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    // Snapshot of property.price when admin approves (deal value for revenue reporting)
    transactionValue: {
      type: Number,
      default: null,
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

transactionRequestSchema.index({ property: 1, status: 1 });
transactionRequestSchema.index({ requestedBy: 1, createdAt: -1 });

const TransactionRequest = mongoose.model("TransactionRequest", transactionRequestSchema);

export default TransactionRequest;
