import mongoose from "mongoose";

const rentLeaseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "TransactionRequest", required: true, unique: true },
    status: {
      type: String,
      enum: ["active", "renewal_pending", "ending_pending", "ended"],
      default: "active",
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    nextDueDate: { type: Date, required: true, index: true },
    monthlyRent: { type: Number, required: true, min: 0 },
    endRequestNote: { type: String, default: "", trim: true },
    endRequestedAt: { type: Date, default: null },
    lastReminder3dAt: { type: Date, default: null },
    lastReminderDueDayAt: { type: Date, default: null },
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
    auditReviewedAt: { type: Date, default: null },
    auditNote: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

rentLeaseSchema.index({ user: 1, status: 1, nextDueDate: 1 });

const RentLease = mongoose.model("RentLease", rentLeaseSchema);
export default RentLease;

