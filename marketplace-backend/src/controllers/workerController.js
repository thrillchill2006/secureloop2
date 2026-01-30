import {
  getAllInformalWorkers,
  getInformalWorkerById,
  updateInformalWorkerProfile,
  updateWorkerWallet,
} from '../models/InformalWorker.js';

export const getWorkers = async (req, res) => {
  try {
    const filters = {
      verification_status: req.query.verification_status,
      service_area: req.query.service_area,
    };

    const { data, error } = await getAllInformalWorkers(filters);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ workers: data });
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getWorkerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await getInformalWorkerById(id);

    if (error || !data) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    res.json({ worker: data });
  } catch (error) {
    console.error('Get worker profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateWorker = async (req, res) => {
  try {
    if (req.role !== 'informal_worker') {
      return res.status(403).json({ message: 'Only workers can update their profile' });
    }

    const updates = {};
    const allowedFields = [
      'id_proof_type',
      'service_area',
      'location_lat',
      'location_lng',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const { data, error } = await updateInformalWorkerProfile(req.user.id, updates);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({
      message: 'Profile updated successfully',
      worker: data,
    });
  } catch (error) {
    console.error('Update worker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getWalletBalance = async (req, res) => {
  try {
    if (req.role !== 'informal_worker') {
      return res.status(403).json({ message: 'Only workers can view wallet' });
    }

    res.json({
      wallet_balance: req.profile.wallet_balance || 0,
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addWalletBalance = async (req, res) => {
  try {
    if (req.role !== 'informal_worker') {
      return res.status(403).json({ message: 'Only workers can update wallet' });
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const { data, error } = await updateWorkerWallet(req.user.id, amount);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({
      message: 'Wallet updated successfully',
      wallet_balance: data.wallet_balance,
    });
  } catch (error) {
    console.error('Add wallet balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
