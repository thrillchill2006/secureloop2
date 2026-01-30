import express from 'express';
import {
  createNewTransaction,
  getTransactionDetails,
  getBuyerTransactions,
  getVendorTransactions,
  updateTransaction,
} from '../controllers/transactionController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, restrictTo('buyer'), createNewTransaction);
router.get('/buyer/:buyerId?', protect, restrictTo('buyer'), getBuyerTransactions);
router.get('/vendor/:vendorId?', protect, restrictTo('vendor'), getVendorTransactions);
router.get('/:id', protect, getTransactionDetails);
router.put('/:id', protect, updateTransaction);

export default router;
