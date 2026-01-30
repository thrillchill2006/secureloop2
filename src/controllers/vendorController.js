import { getAllVendors, getVendorById, updateVendorProfile } from '../models/Vendor.js';
import { getListingsByVendor } from '../models/Listing.js';

export const getVendors = async (req, res) => {
  try {
    const filters = {
      verification_status: req.query.verification_status,
      material_type: req.query.material_type,
      min_rating: req.query.min_rating ? parseFloat(req.query.min_rating) : undefined,
    };

    const { data, error } = await getAllVendors(filters);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ vendors: data });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVendorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await getVendorById(id);

    if (error || !data) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Get vendor's active listings
    const { data: listings } = await getListingsByVendor(id);

    res.json({
      vendor: data,
      listings: listings || [],
    });
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateVendor = async (req, res) => {
  try {
    if (req.role !== 'vendor') {
      return res.status(403).json({ message: 'Only vendors can update their profile' });
    }

    const updates = {};
    const allowedFields = [
      'business_name',
      'material_types',
      'quality_grades',
      'location_city',
      'location_lat',
      'location_lng',
      'description',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const { data, error } = await updateVendorProfile(req.user.id, updates);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({
      message: 'Profile updated successfully',
      vendor: data,
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
