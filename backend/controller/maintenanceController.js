import MaintenanceRequest from "../models/maintenanceRequestModel.js";
import Property from "../models/propertyModel.js";
import RentLease from "../models/rentLeaseModel.js";
import userModel from "../models/userModel.js";
import emailService from "../services/emailService.js";
import logger from "../utils/logger.js";
import { createNotification } from "./notificationController.js";
import { uploadLocalImage } from "../config/cloudinary.js";
import fs from "fs";

const populateList = [
  { path: "property", select: "title location image" },
  { path: "requestedBy", select: "name email" },
  { path: "assignedTo", select: "name email" },
];

async function assertUserOwnsProperty(userId, propertyId) {
  const property = await Property.findOne({
    _id: propertyId,
    postedBy: userId,
  });
  return property;
}

/** POST /api/maintenance — authenticated renter with active lease */
export const createMaintenanceRequest = async (req, res) => {
  try {
    const { title, description, priority, propertyId } = req.body;
    if (!title || !description || !propertyId) {
      return res.status(400).json({
        success: false,
        message: "title, description, and propertyId are required",
      });
    }

    const property = await Property.findById(propertyId).select("_id title location image");
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    const activeLease = await RentLease.findOne({
      user: req.user._id,
      property: propertyId,
      status: "active",
    }).select("_id");

    if (!activeLease) {
      return res.status(403).json({
        success: false,
        message: "Only renters with an active lease can request maintenance for this property",
      });
    }

    const request = await MaintenanceRequest.create({
      title: String(title).trim(),
      description: String(description).trim(),
      priority: ["low", "medium", "high", "urgent"].includes(priority)
        ? priority
        : "medium",
      property: propertyId,
      lease: activeLease._id,
      requestedBy: req.user._id,
      status: "open",
    });

    const populated = await MaintenanceRequest.findById(request._id).populate(populateList);
    res.status(201).json({ success: true, request: populated });
  } catch (error) {
    logger.error("createMaintenanceRequest", { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Failed to create request" });
  }
};

/** GET /api/maintenance/my — list for current user */
export const getMyMaintenanceRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const query = { requestedBy: req.user._id };
    const total = await MaintenanceRequest.countDocuments(query);
    const requests = await MaintenanceRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(populateList);

    res.json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    logger.error("getMyMaintenanceRequests", { error: error.message });
    res.status(500).json({ success: false, message: "Failed to load requests" });
  }
};

/** GET /api/maintenance/my/:id — single (owner only) */
export const getMyMaintenanceRequestById = async (req, res) => {
  try {
    const doc = await MaintenanceRequest.findOne({
      _id: req.params.id,
      requestedBy: req.user._id,
    }).populate(populateList);

    if (!doc) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    res.json({ success: true, request: doc });
  } catch (error) {
    logger.error("getMyMaintenanceRequestById", { error: error.message });
    res.status(500).json({ success: false, message: "Failed to load request" });
  }
};

/** GET /api/maintenance/all — admin */
export const getAllMaintenanceRequests = async (req, res) => {
  try {
    const status = req.query.status;
    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = (page - 1) * limit;

    const total = await MaintenanceRequest.countDocuments(query);
    const requests = await MaintenanceRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(populateList);

    res.json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    logger.error("getAllMaintenanceRequests", { error: error.message });
    res.status(500).json({ success: false, message: "Failed to load requests" });
  }
};

/** GET /api/maintenance/staff — maintenance users for assignment (admin) */
export const listMaintenanceStaff = async (req, res) => {
  try {
    const staff = await userModel
      .find({
        role: "maintenance",
        $nor: [{ status: "banned" }, { status: "suspended" }],
      })
      .select("name email _id role status")
      .sort({ name: 1 })
      .lean();

    res.json({ success: true, staff });
  } catch (error) {
    logger.error("listMaintenanceStaff", { error: error.message });
    res.status(500).json({ success: false, message: "Failed to load staff" });
  }
};

/** PUT /api/maintenance/:id/assign — admin */
export const assignMaintenanceRequest = async (req, res) => {
  try {
    const { staffUserId } = req.body;
    if (!staffUserId) {
      return res.status(400).json({
        success: false,
        message: "staffUserId is required",
      });
    }

    const staff = await userModel.findOne({
      _id: staffUserId,
      role: "maintenance",
    });
    if (!staff) {
      return res.status(400).json({
        success: false,
        message: "Invalid maintenance staff user",
      });
    }

    const doc = await MaintenanceRequest.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (["completed", "cancelled"].includes(doc.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot reassign a completed or cancelled request",
      });
    }

    doc.assignedTo = staff._id;
    doc.assignedBy = req.admin?.email || "admin";
    doc.assignedAt = new Date();
    doc.status = "assigned";
    await doc.save();

    const populated = await MaintenanceRequest.findById(doc._id).populate(populateList);

    const propertyTitle = populated?.property?.title || "a property";
    const propertyLocation = populated?.property?.location || "";
    await createNotification({
      user: staff._id,
      title: "New maintenance assignment",
      message: `You have been assigned a maintenance request for ${propertyTitle}${
        propertyLocation ? ` (${propertyLocation})` : ""
      }.`,
      type: "general",
      metadata: {
        maintenanceRequestId: doc._id,
        propertyId: populated?.property?._id,
      },
    });

    if (staff.email) {
      const subject = `New Maintenance Assignment - ${propertyTitle}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="margin: 0 0 12px 0;">New Maintenance Assignment</h2>
          <p style="margin: 0 0 8px 0;">You have been assigned a new maintenance request.</p>
          <p style="margin: 0 0 4px 0;"><strong>Property:</strong> ${propertyTitle}</p>
          ${propertyLocation ? `<p style="margin: 0 0 4px 0;"><strong>Location:</strong> ${propertyLocation}</p>` : ""}
          <p style="margin: 0 0 4px 0;"><strong>Issue:</strong> ${populated?.title || ""}</p>
          <p style="margin: 0 0 12px 0;"><strong>Priority:</strong> ${(populated?.priority || "medium").toString().toUpperCase()}</p>
          <p style="margin: 0 0 12px 0; color: #6B7280;">
            Sign in to your maintenance dashboard to start work and update progress.
          </p>
        </div>
      `;
      await emailService.sendEmailSafely(staff.email, subject, htmlContent);
    }

    res.json({ success: true, request: populated });
  } catch (error) {
    logger.error("assignMaintenanceRequest", { error: error.message });
    res.status(500).json({ success: false, message: "Failed to assign request" });
  }
};

/** GET /api/maintenance/assigned — staff: my assignments */
export const getAssignedMaintenanceRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = (page - 1) * limit;

    const query = { assignedTo: req.user._id };
    const status = req.query.status;
    if (status && status !== "all") {
      query.status = status;
    }

    const total = await MaintenanceRequest.countDocuments(query);
    const requests = await MaintenanceRequest.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(populateList);

    res.json({
      success: true,
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    logger.error("getAssignedMaintenanceRequests", { error: error.message });
    res.status(500).json({ success: false, message: "Failed to load assignments" });
  }
};

/** PUT /api/maintenance/:id/status — assigned staff only */
export const updateMaintenanceStatus = async (req, res) => {
  try {
    const { status: nextStatus, completionNotes, completionCost, materials } = req.body;

    const doc = await MaintenanceRequest.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (!doc.assignedTo || doc.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update requests assigned to you",
      });
    }

    if (!nextStatus || !["in_progress", "completed"].includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: "Staff may only set status to in_progress or completed",
      });
    }

    if (doc.status === "completed" || doc.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This request is already closed",
      });
    }

    if (nextStatus === "in_progress") {
      if (doc.status !== "assigned") {
        return res.status(400).json({
          success: false,
          message: "Work can start only after an admin assigns the request",
        });
      }
    }

    if (nextStatus === "completed") {
      if (doc.status !== "in_progress") {
        return res.status(400).json({
          success: false,
          message: "Mark in progress before completing",
        });
      }
      doc.completedAt = new Date();
      if (completionNotes !== undefined) {
        doc.completionNotes = String(completionNotes).trim();
      }
      if (completionCost !== undefined && completionCost !== null && completionCost !== "") {
        const n = Number(completionCost);
        if (!Number.isNaN(n) && n >= 0) {
          doc.completionCost = n;
        }
      }

      const parsedMaterials = (() => {
        if (!materials) return [];
        if (Array.isArray(materials)) return materials;
        try {
          const m = JSON.parse(materials);
          return Array.isArray(m) ? m : [];
        } catch {
          return [];
        }
      })();

      if (!parsedMaterials.length) {
        return res.status(400).json({
          success: false,
          message: "Materials list is required for completion audit",
        });
      }

      const normalizedMaterials = parsedMaterials
        .map((entry) => {
          const item = String(entry?.item || "").trim();
          const quantity = Number(entry?.quantity || 0);
          const unitCost = Number(entry?.unitCost || 0);
          const totalCost = Number(entry?.totalCost || quantity * unitCost || 0);
          return {
            item,
            quantity: Number.isNaN(quantity) ? 0 : Math.max(0, quantity),
            unitCost: Number.isNaN(unitCost) ? 0 : Math.max(0, unitCost),
            totalCost: Number.isNaN(totalCost) ? 0 : Math.max(0, totalCost),
          };
        })
        .filter((entry) => entry.item);

      if (!normalizedMaterials.length) {
        return res.status(400).json({
          success: false,
          message: "Valid materials are required for completion audit",
        });
      }

      const files = req.files || [];
      if (!files.length) {
        return res.status(400).json({
          success: false,
          message: "Materials receipt is required for audit",
        });
      }

      const receiptUrl = await uploadLocalImage(files[0].path, "MaintenanceAuditReceipts");
      fs.unlink(files[0].path, () => {});

      doc.materials = normalizedMaterials;
      doc.materialsTotal = normalizedMaterials.reduce((sum, entry) => sum + (entry.totalCost || 0), 0);
      doc.materialsReceiptUrl = receiptUrl;
      doc.auditStatus = "pending";
      doc.auditReviewedBy = null;
      doc.auditReviewedAt = null;
      doc.auditNote = "";
    }

    doc.status = nextStatus;
    await doc.save();

    if (nextStatus === "completed") {
      const financeUsers = await userModel
        .find({ role: "finance", status: "active" })
        .select("_id name email")
        .lean();
      const propertyRef = await doc.populate({ path: "property", select: "title location" });
      const propertyTitle = propertyRef?.property?.title || "property";
      await Promise.all(
        financeUsers.map(async (financeUser) => {
          await createNotification({
            user: financeUser._id,
            title: "Maintenance audit pending",
            message: `A maintenance completion for ${propertyTitle} is waiting for finance audit.`,
            type: "general",
            metadata: { maintenanceRequestId: doc._id },
          });
          if (financeUser.email) {
            await emailService.sendEmailSafely(
              financeUser.email,
              "Maintenance Audit Pending Review",
              `<p>A maintenance request for <strong>${propertyTitle}</strong> has been marked completed and is pending audit review.</p>`
            );
          }
        })
      );
    }

    const populated = await MaintenanceRequest.findById(doc._id).populate(populateList);
    res.json({ success: true, request: populated });
  } catch (error) {
    logger.error("updateMaintenanceStatus", { error: error.message });
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

/** GET /api/maintenance/audits — finance queue */
export const getMaintenanceAudits = async (req, res) => {
  try {
    const auditStatus = req.query.auditStatus;
    const query = { status: "completed" };
    if (auditStatus && auditStatus !== "all") {
      query.auditStatus = auditStatus;
    }
    const requests = await MaintenanceRequest.find(query)
      .sort({ updatedAt: -1 })
      .populate(populateList);
    return res.json({ success: true, requests });
  } catch (error) {
    logger.error("getMaintenanceAudits", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to load maintenance audits" });
  }
};

/** PUT /api/maintenance/:id/audit — finance approve/reject */
export const reviewMaintenanceAudit = async (req, res) => {
  try {
    const { auditStatus, note } = req.body || {};
    if (!["approved", "rejected"].includes(auditStatus)) {
      return res.status(400).json({ success: false, message: "auditStatus must be approved or rejected" });
    }
    const doc = await MaintenanceRequest.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }
    if (doc.status !== "completed") {
      return res.status(400).json({ success: false, message: "Only completed requests can be audited" });
    }
    doc.auditStatus = auditStatus;
    doc.auditNote = note ? String(note).trim() : "";
    doc.auditReviewedBy = req.user?._id || null;
    doc.auditReviewedAt = new Date();
    await doc.save();

    if (doc.assignedTo) {
      await createNotification({
        user: doc.assignedTo,
        title: "Maintenance audit updated",
        message: `Finance marked your maintenance submission as ${auditStatus}.`,
        type: "general",
        metadata: { maintenanceRequestId: doc._id },
      });
    }

    const populated = await MaintenanceRequest.findById(doc._id).populate(populateList);
    return res.json({ success: true, request: populated });
  } catch (error) {
    logger.error("reviewMaintenanceAudit", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to review maintenance audit" });
  }
};
