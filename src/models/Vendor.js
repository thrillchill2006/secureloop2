import { supabaseAdmin } from '../config/supabase.js';

export async function createVendorProfile(payload) {
  return supabaseAdmin.from('vendors').insert(payload).select().single();
}

export async function getVendorByUserId(userId) {
  return supabaseAdmin.from('vendors').select('*').eq('user_id', userId).single();
}

export async function getVendorById(id) {
  return supabaseAdmin.from('vendors').select('*').eq('id', id).single();
}

export async function updateVendorProfile(userId, updates) {
  return supabaseAdmin
    .from('vendors')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
}

export async function getAllVendors(filters = {}) {
  let query = supabaseAdmin.from('vendors').select('*');
  
  if (filters.verification_status) {
    query = query.eq('verification_status', filters.verification_status);
  }
  
  if (filters.material_type) {
    query = query.contains('material_types', [filters.material_type]);
  }
  
  if (filters.min_rating) {
    query = query.gte('rating', filters.min_rating);
  }
  
  return query;
}

export async function updateVendorRating(vendorId, newRating) {
  return supabaseAdmin
    .from('vendors')
    .update({ rating: newRating, updated_at: new Date().toISOString() })
    .eq('id', vendorId)
    .select()
    .single();
}
