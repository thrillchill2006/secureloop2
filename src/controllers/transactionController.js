import {
  createTransaction,
  getTransactionById,
  getTransactionsByBuyer,
  getTransactionsByVendor,
  updateTransactionStatus,
} from '../models/Transaction.js';
import { getListingById, updateListingStatus } from '../models/Listing.js';
import { updateWorkerWallet } from '../models/InformalWorker.js';

export const createNewTransaction = async (req, res) => {
  try {
    if (req.role !== 'buyer') {
      return res.status(403).json({ message: 'Only buyers can create transactions' });
    }

    const { listing_id, quantity_requested_kg, pickup_address } = req.body;

    if (!listing_id || !quantity_requested_kg) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const { data: listing, error: listingError } = await getListingById(listing_id);

    if (listingError || !listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (listing.status !== 'available') {
      return res.status(400).json({ message: 'Listing is not available' });
    }

    if (quantity_requested_kg > listing.quantity_kg) {
      return res.status(400).json({ message: 'Requested quantity exceeds available quantity' });
    }

    const totalAmount = quantity_requested_kg * listing.price_per_kg;

    const transactionData = {
      buyer_id: req.profile.id,
      vendor_id: listing.vendor_id,
      listing_id: listing.id,
      quantity_kg: parseFloat(quantity_requested_kg),
      price_per_kg: listing.price_per_kg,
      total_amount: totalAmount,
      pickup_address: pickup_address || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await createTransaction(transactionData);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Update listing status to reserved
    await updateListingStatus(listing_id, 'reserved');

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: data,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getTransactionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await getTransactionById(id);

    if (error || !data) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check authorization
    if (
      req.profile.id !== data.buyer_id &&
      req.profile.id !== data.vendor_id
    ) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.json({ transaction: data });
  } catch (error) {
    console.error('Get transaction details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBuyerTransactions = async (req, res) => {
  try {
    const buyerId = req.params.buyerId || req.profile.id;

    if (req.role !== 'buyer' || req.profile.id !== buyerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { data, error } = await getTransactionsByBuyer(buyerId);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ transactions: data });
  } catch (error) {
    console.error('Get buyer transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVendorTransactions = async (req, res) => {
  try {
    const vendorId = req.params.vendorId || req.profile.id;

    if (req.role !== 'vendor' || req.profile.id !== vendorId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { data, error } = await getTransactionsByVendor(vendorId);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ transactions: data });
  } catch (error) {
    console.error('Get vendor transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pickup_date, delivery_date } = req.body;

    const { data: transaction } = await getTransactionById(id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Authorization check
    const isVendor = req.role === 'vendor' && req.profile.id === transaction.vendor_id;
    const isBuyer = req.role === 'buyer' && req.profile.id === transaction.buyer_id;

    if (!isVendor && !isBuyer) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (pickup_date) updates.pickup_date = pickup_date;
    if (delivery_date) updates.delivery_date = delivery_date;

    const { data, error } = await updateTransactionStatus(id, status, updates);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // If completed, update listing quantity or status
    if (status === 'completed') {
      const { data: listing } = await getListingById(transaction.listing_id);
      const remainingQty = listing.quantity_kg - transaction.quantity_kg;

      if (remainingQty <= 0) {
        await updateListingStatus(transaction.listing_id, 'sold');
      } else {
        await updateListingStatus(transaction.listing_id, 'available');
      }
    }

    res.json({
      message: 'Transaction updated successfully',
      transaction: data,
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
