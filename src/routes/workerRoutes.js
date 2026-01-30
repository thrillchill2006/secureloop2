import express from 'express';
import {
  getWorkers,
  getWorkerProfile,
  updateWorker,
  getWalletBalance,
  addWalletBalance,
} from '../controllers/workerController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getWorkers);
router.get('/:id', getWorkerProfile);
router.put('/profile', protect, restrictTo('informal_worker'), updateWorker);
router.get('/wallet/balance', protect, restrictTo('informal_worker'), getWalletBalance);
router.post('/wallet/add', protect, restrictTo('informal_worker'), addWalletBalance);

export default router;
