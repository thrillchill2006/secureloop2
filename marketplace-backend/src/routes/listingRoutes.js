import express from 'express';
import {
  getListings,
  createNewListing,
  getListingDetails,
  updateListingDetails,
  removeListings,
  getVendorListings,
  getPriceRecommendation,
} from '../controllers/listingController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getListings);
router.post('/', protect, restrictTo('vendor'), createNewListing);
router.get('/price-recommendation', getPriceRecommendation);
router.get('/vendor/:vendorId', getVendorListings);
router.get('/:id', getListingDetails);
router.put('/:id', protect, restrictTo('vendor'), updateListingDetails);
router.delete('/:id', protect, restrictTo('vendor'), removeListings);

export default router;
