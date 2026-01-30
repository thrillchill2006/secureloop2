import { supabaseAdmin } from '../config/supabase.js';

export async function createTransaction(payload) {
  return supabaseAdmin.from('transactions').insert(payload).select().single();
}

export async function getTransactionById(id) {
  return supabaseAdmin
    .from('transactions')
    .select('*, buyers(*), vendors(*), listings(*)')
    .eq('id', id)
    .single();
}

export async function getTransactionsByBuyer(buyerId) {
  return supabaseAdmin
    .from('transactions')
    .select('*, vendors(name, business_name), listings(material_type, quantity_kg)')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
}

export async function getTransactionsByVendor(vendorId) {
  return supabaseAdmin
    .from('transactions')
    .select('*, buyers(name), listings(material_type, quantity_kg)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });
}

export async function updateTransactionStatus(id, status, updates = {}) {
  return supabaseAdmin
    .from('transactions')
    .update({ 
      status, 
      ...updates,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();
}

export async function getMarketSignals(materialType = null) {
  let query = supabaseAdmin
    .from('transactions')
    .select('listing_id, total_amount, created_at, listings(material_type, quantity_kg, price_per_kg)')
    .eq('status', 'completed')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  if (materialType) {
    query = query.eq('listings.material_type', materialType);
  }
  
  return query;
}
