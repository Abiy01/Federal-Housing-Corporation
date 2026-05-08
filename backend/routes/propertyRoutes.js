import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const selfListingDisabledResponse = (_req, res) => {
  res.status(403).json({
    success: false,
    message: 'Self-listing is disabled. Properties are listed by admin only.',
  });
};

// ── Self-listing endpoints disabled: admin lists properties from admin panel ─
router.all('/user/properties', protect, selfListingDisabledResponse);
router.all('/user/properties/:id', protect, selfListingDisabledResponse);

export default router;