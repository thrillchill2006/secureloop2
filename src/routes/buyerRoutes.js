import express from 'express';
import {
  getBuyers,
  getBuyerProfile,
  updateBuyer,
} from '../controllers/buyerController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getBuyers);
router.get('/:id', getBuyerProfile);
router.put('/profile', protect, restrictTo('buyer'), updateBuyer);

export default router;
