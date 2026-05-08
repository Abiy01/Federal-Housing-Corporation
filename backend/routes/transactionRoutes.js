import express from "express";
import { protect, adminProtect } from "../middleware/authMiddleware.js";
import {
  approveTransactionRequest,
  createTransactionRequest,
  getAllTransactionRequests,
  getMyTransactionRequests,
  rejectTransactionRequest,
} from "../controller/transactionController.js";

const router = express.Router();

router.post("/", protect, createTransactionRequest);
router.get("/my", protect, getMyTransactionRequests);

router.get("/all", adminProtect, getAllTransactionRequests);
router.put("/:id/approve", adminProtect, approveTransactionRequest);
router.put("/:id/reject", adminProtect, rejectTransactionRequest);

export default router;
