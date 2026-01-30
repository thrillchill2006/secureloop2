import { supabaseAdmin, supabasePublic } from '../config/supabase.js';
import { createBuyerProfile } from '../models/Buyer.js';
import { createVendorProfile } from '../models/Vendor.js';
import { createInformalWorkerProfile } from '../models/InformalWorker.js';

/* ---------- SIGN UP / REGISTER ---------- */

export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword, role, additionalData } = req.body;

    if (!name || !email || !mobile || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: 'All fields required' });
    }

    if (!['buyer', 'vendor', 'informal_worker'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, mobile, role },
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const userId = data.user.id;

    const baseProfile = {
      user_id: userId,
      name,
      email,
      mobile,
      created_at: new Date().toISOString(),
    };

    let profileResult;
    if (role === 'buyer') {
      profileResult = await createBuyerProfile({
        ...baseProfile,
        preferred_materials: additionalData?.preferred_materials || [],
        location_city: additionalData?.location_city || null,
        location_lat: additionalData?.location_lat || null,
        location_lng: additionalData?.location_lng || null,
        verification_status: 'unverified',
      });
    } else if (role === 'vendor') {
      profileResult = await createVendorProfile({
        ...baseProfile,
        business_name: additionalData?.business_name || null,
        material_types: additionalData?.material_types || [],
        quality_grades: additionalData?.quality_grades || [],
        location_city: additionalData?.location_city || null,
        location_lat: additionalData?.location_lat || null,
        location_lng: additionalData?.location_lng || null,
        rating: 0,
        verification_status: 'unverified',
      });
    } else {
      profileResult = await createInformalWorkerProfile({
        ...baseProfile,
        id_proof_type: additionalData?.id_proof_type || null,
        service_area: additionalData?.service_area || null,
        location_lat: additionalData?.location_lat || null,
        location_lng: additionalData?.location_lng || null,
        verification_status: 'unverified',
        wallet_balance: 0,
      });
    }

    if (profileResult.error) {
      return res.status(400).json({ message: profileResult.error.message });
    }

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        name,
        email,
        mobile,
        role,
      },
      profile: profileResult.data,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ---------- LOGIN ---------- */

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide email and password' });
    }

    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      message: 'Login successful',
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: data.user,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await supabaseAdmin.auth.admin.signOut(token);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.json({ message: 'Logged out successfully' });
  }
};

export const getProfile = async (req, res) => {
  try {
    return res.json({
      user: req.user,
      profile: req.profile,
      role: req.role,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
