import express from "express";
import {
  protect,
  adminProtect,
  requireMaintenanceStaff,
  requireFinanceUser,
} from "../middleware/authMiddleware.js";
import upload from "../middleware/multer.js";
import {
  assignMaintenanceRequest,
  createMaintenanceRequest,
  getAllMaintenanceRequests,
  getMaintenanceAudits,
  getAssignedMaintenanceRequests,
  getMyMaintenanceRequestById,
  getMyMaintenanceRequests,
  listMaintenanceStaff,
  reviewMaintenanceAudit,
  updateMaintenanceStatus,
} from "../controller/maintenanceController.js";

const router = express.Router();

router.post("/", protect, createMaintenanceRequest);

router.get("/my", protect, getMyMaintenanceRequests);
router.get("/my/:id", protect, getMyMaintenanceRequestById);

router.get("/all", adminProtect, getAllMaintenanceRequests);
router.get("/staff", adminProtect, listMaintenanceStaff);
router.put("/:id/assign", adminProtect, assignMaintenanceRequest);

router.get("/assigned", protect, requireMaintenanceStaff, getAssignedMaintenanceRequests);
router.put("/:id/status", protect, requireMaintenanceStaff, upload.array("materialsReceipt", 1), updateMaintenanceStatus);
router.get("/audits", protect, requireFinanceUser, getMaintenanceAudits);
router.put("/:id/audit", protect, requireFinanceUser, reviewMaintenanceAudit);

export default router;
