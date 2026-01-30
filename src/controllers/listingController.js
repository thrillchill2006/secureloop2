import {
  getAllListings,
  createListing,
  getListingById,
  updateListing,
  deleteListing,
  updateListingStatus,
  getListingsByVendor,
} from '../models/Listing.js';
import { getVendorById } from '../models/Vendor.js';
import { rankVendors } from '../utils/ranking.js';
import { recommendPrice } from '../utils/pricing.js';

export const getListings = async (req, res) => {
  try {
    const filters = {
      material_type: req.query.material_type,
      quality_grade: req.query.quality_grade,
      status: req.query.status,
      min_quantity: req.query.min_quantity ? parseFloat(req.query.min_quantity) : undefined,
      max_price: req.query.max_price ? parseFloat(req.query.max_price) : undefined,
    };

    const { data, error } = await getAllListings(filters);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Add ranking if buyer location provided
    if (req.query.buyer_lat && req.query.buyer_lng) {
      const buyerLocation = {
        lat: parseFloat(req.query.buyer_lat),
        lng: parseFloat(req.query.buyer_lng),
      };

      const vendorsForRanking = data.map((listing) => ({
        id: listing.vendor_id,
        distanceKm: null,
        grading: listing.quality_grade || 5,
        pricing: listing.price_per_kg,
        availability: listing.status === 'available',
        reviewRating: listing.vendors?.rating || 0,
        location: {
          lat: listing.vendors?.location_lat,
          lng: listing.vendors?.location_lng,
        },
        materialType: listing.material_type,
        listing,
      }));

      const rankedVendors = rankVendors(
        vendorsForRanking,
        undefined,
        { buyerLocation }
      );

      const rankedListings = rankedVendors.map((v) => ({
        ...v.listing,
        vendor_score: v.score,
        score_breakdown: v.scoreBreakdown,
        distance_km: v.distanceKm,
      }));

      return res.json({ listings: rankedListings });
    }

    res.json({ listings: data });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createNewListing = async (req, res) => {
  try {
    if (req.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can create listings' });
    }

    const {
      material_type,
      quantity_kg,
      quality_grade,
      price_per_kg,
      description,
      location_address,
    } = req.body;

    if (!material_type || !quantity_kg || !price_per_kg) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const listingData = {
      vendor_id: req.profile.id,
      material_type,
      quantity_kg: parseFloat(quantity_kg),
      quality_grade: quality_grade || null,
      price_per_kg: parseFloat(price_per_kg),
      description: description || null,
      location_address: location_address || null,
      status: 'available',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await createListing(listingData);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json({
      message: 'Listing created successfully',
      listing: data,
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getListingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await getListingById(id);

    if (error || !data) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing: data });
  } catch (error) {
    console.error('Get listing details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateListingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can update listings' });
    }

    const { data: listing } = await getListingById(id);
    if (!listing || listing.vendor_id !== req.profile.id) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const updates = {};
    const allowedFields = [
      'quantity_kg',
      'quality_grade',
      'price_per_kg',
      'description',
      'location_address',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const { data, error } = await updateListing(id, updates);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({
      message: 'Listing updated successfully',
      listing: data,
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeListings = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can delete listings' });
    }

    const { data: listing } = await getListingById(id);
    if (!listing || listing.vendor_id !== req.profile.id) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    const { error } = await deleteListing(id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVendorListings = async (req, res) => {
  try {
    const vendorId = req.params.vendorId || req.profile.id;
    
    const { data, error } = await getListingsByVendor(vendorId);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ listings: data });
  } catch (error) {
    console.error('Get vendor listings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPriceRecommendation = async (req, res) => {
  try {
    const { material_type, quantity_kg, quality_grade, base_market_price } = req.query;

    if (!material_type || !base_market_price) {
      return res.status(400).json({ message: 'material_type and base_market_price required' });
    }

    const priceRec = recommendPrice({
      baseMarketPrice: parseFloat(base_market_price),
      grade: quality_grade ? parseFloat(quality_grade) : undefined,
      demandIndex: 0.6,
      supplyIndex: 0.4,
    });

    res.json({
      material_type,
      quantity_kg: quantity_kg ? parseFloat(quantity_kg) : null,
      quality_grade: quality_grade ? parseFloat(quality_grade) : null,
      recommendation: priceRec,
    });
  } catch (error) {
    console.error('Price recommendation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
