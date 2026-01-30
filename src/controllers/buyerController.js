import { getAllBuyers, getBuyerById, updateBuyerProfile } from '../models/Buyer.js';

export const getBuyers = async (req, res) => {
  try {
    const filters = {
      verification_status: req.query.verification_status,
      location_city: req.query.location_city,
    };

    const { data, error } = await getAllBuyers(filters);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ buyers: data });
  } catch (error) {
    console.error('Get buyers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBuyerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await getBuyerById(id);

    if (error || !data) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    res.json({ buyer: data });
  } catch (error) {
    console.error('Get buyer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBuyer = async (req, res) => {
  try {
    if (req.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can update their profile' });
    }

    const updates = {};
    const allowedFields = [
      'preferred_materials',
      'location_city',
      'location_lat',
      'location_lng',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const { data, error } = await updateBuyerProfile(req.user.id, updates);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({
      message: 'Profile updated successfully',
      buyer: data,
    });
  } catch (error) {
    console.error('Update buyer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
