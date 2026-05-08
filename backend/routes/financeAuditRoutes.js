import express from "express";
import { protect, requireFinanceUser } from "../middleware/authMiddleware.js";
import {
  getFinanceAuditSummary,
  getFinanceLeases,
  getFinancePayments,
  getFinanceTransactions,
  reviewFinanceLease,
  reviewFinancePayment,
  reviewFinanceTransaction,
} from "../controller/financeAuditController.js";

const router = express.Router();

router.use(protect, requireFinanceUser);

router.get("/summary", getFinanceAuditSummary);
router.get("/payments", getFinancePayments);
router.put("/payments/:id/review", reviewFinancePayment);
router.get("/leases", getFinanceLeases);
router.put("/leases/:id/review", reviewFinanceLease);
router.get("/transactions", getFinanceTransactions);
router.put("/transactions/:id/review", reviewFinanceTransaction);

export default router;
