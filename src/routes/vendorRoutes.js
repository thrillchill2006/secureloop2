import express from 'express';
import {
  getVendors,
  getVendorProfile,
  updateVendor,
} from '../controllers/vendorController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getVendors);
router.get('/:id', getVendorProfile);
router.put('/profile', protect, restrictTo('vendor'), updateVendor);

export default router;
