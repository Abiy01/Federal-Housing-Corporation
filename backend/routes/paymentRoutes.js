import express from "express";
import { adminProtect, protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/multer.js";
import {
  createPayment,
  getAllPayments,
  getPaymentMethods,
  getMyPayments,
  updatePaymentStatus,
} from "../controller/paymentController.js";

const router = express.Router();

router.get("/methods", getPaymentMethods);
router.post(
  "/",
  protect,
  upload.fields([
    { name: "receipt", maxCount: 1 },
    { name: "contract", maxCount: 1 },
  ]),
  createPayment
);
router.get("/my", protect, getMyPayments);

router.get("/all", adminProtect, getAllPayments);
router.put("/:id/status", adminProtect, updatePaymentStatus);

export default router;
