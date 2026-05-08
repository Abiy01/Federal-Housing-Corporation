import express from "express";
import { adminProtect, protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/multer.js";
import {
  getAllLeases,
  getMyLeaseDues,
  getMyLeases,
  requestEndContract,
  requestLeaseRenewal,
  updateLeaseStatus,
} from "../controller/leaseController.js";

const router = express.Router();

router.get("/my", protect, getMyLeases);
router.get("/my/dues", protect, getMyLeaseDues);
router.post("/renew", protect, upload.array("receipt", 1), requestLeaseRenewal);
router.post("/end-request", protect, requestEndContract);

router.get("/all", adminProtect, getAllLeases);
router.put("/:id/status", adminProtect, updateLeaseStatus);

export default router;

