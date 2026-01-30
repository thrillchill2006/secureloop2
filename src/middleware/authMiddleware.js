import { supabaseAdmin } from '../config/supabase.js';
import { getBuyerByUserId } from '../models/Buyer.js';
import { getVendorByUserId } from '../models/Vendor.js';
import { getInformalWorkerByUserId } from '../models/InformalWorker.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    const role = data.user.user_metadata?.role;
    let profile = null;

    if (role === 'buyer') {
      const { data: p } = await getBuyerByUserId(data.user.id);
      profile = p;
    } else if (role === 'vendor') {
      const { data: p } = await getVendorByUserId(data.user.id);
      profile = p;
    } else if (role === 'informal_worker') {
      const { data: p } = await getInformalWorkerByUserId(data.user.id);
      profile = p;
    }

    req.user = data.user;
    req.profile = profile;
    req.role = role;

    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};
