import { supabaseAdmin } from '../config/supabase.js';

export async function createBuyerProfile(payload) {
  return supabaseAdmin.from('buyers').insert(payload).select().single();
}

export async function getBuyerByUserId(userId) {
  return supabaseAdmin.from('buyers').select('*').eq('user_id', userId).single();
}

export async function getBuyerById(id) {
  return supabaseAdmin.from('buyers').select('*').eq('id', id).single();
}

export async function updateBuyerProfile(userId, updates) {
  return supabaseAdmin
    .from('buyers')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
}

export async function getAllBuyers(filters = {}) {
  let query = supabaseAdmin.from('buyers').select('*');
  
  if (filters.verification_status) {
    query = query.eq('verification_status', filters.verification_status);
  }
  
  if (filters.location_city) {
    query = query.eq('location_city', filters.location_city);
  }
  
  return query;
}
