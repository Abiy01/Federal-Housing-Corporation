import mongoose from "mongoose";

/** Workflow: open → assigned (admin assigns staff) → in_progress → completed */
const maintenanceRequestSchema = new mongoose.Schema(
  {
    materials: {
      type: [
        {
          item: { type: String, required: true, trim: true },
          quantity: { type: Number, min: 0, default: 1 },
          unitCost: { type: Number, min: 0, default: 0 },
          totalCost: { type: Number, min: 0, default: 0 },
        },
      ],
      default: [],
    },
    materialsTotal: { type: Number, default: 0, min: 0 },
    materialsReceiptUrl: { type: String, default: "", trim: true },
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
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "assigned", "in_progress", "completed", "cancelled"],
      default: "open",
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    lease: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentLease",
      default: null,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedBy: {
      type: String,
      default: "",
    },
    assignedAt: { type: Date, default: null },
    completionCost: { type: Number, default: null },
    completionNotes: { type: String, default: "" },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

maintenanceRequestSchema.index({ status: 1, createdAt: -1 });
maintenanceRequestSchema.index({ assignedTo: 1, status: 1 });

const MaintenanceRequest = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);

export default MaintenanceRequest;
