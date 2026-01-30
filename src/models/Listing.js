import { supabaseAdmin } from '../config/supabase.js';

export async function createListing(payload) {
  return supabaseAdmin.from('listings').insert(payload).select().single();
}

export async function getListingById(id) {
  return supabaseAdmin
    .from('listings')
    .select('*, vendors(*)')
    .eq('id', id)
    .single();
}

export async function getListingsByVendor(vendorId) {
  return supabaseAdmin
    .from('listings')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });
}

export async function getAllListings(filters = {}) {
  let query = supabaseAdmin
    .from('listings')
    .select('*, vendors(name, business_name, rating, location_lat, location_lng)');
  
  if (filters.material_type) {
    query = query.eq('material_type', filters.material_type);
  }
  
  if (filters.quality_grade) {
    query = query.eq('quality_grade', filters.quality_grade);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    query = query.eq('status', 'available');
  }
  
  if (filters.min_quantity) {
    query = query.gte('quantity_kg', filters.min_quantity);
  }
  
  if (filters.max_price) {
    query = query.lte('price_per_kg', filters.max_price);
  }
  
  query = query.order('created_at', { ascending: false });
  
  return query;
}

export async function updateListing(id, updates) {
  return supabaseAdmin
    .from('listings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

export async function deleteListing(id) {
  return supabaseAdmin.from('listings').delete().eq('id', id);
}

export async function updateListingStatus(id, status) {
  return supabaseAdmin
    .from('listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}
