import { supabaseAdmin } from '../config/supabase.js';

export async function createInformalWorkerProfile(payload) {
  return supabaseAdmin.from('informal_workers').insert(payload).select().single();
}

export async function getInformalWorkerByUserId(userId) {
  return supabaseAdmin.from('informal_workers').select('*').eq('user_id', userId).single();
}

export async function getInformalWorkerById(id) {
  return supabaseAdmin.from('informal_workers').select('*').eq('id', id).single();
}

export async function updateInformalWorkerProfile(userId, updates) {
  return supabaseAdmin
    .from('informal_workers')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
}

export async function updateWorkerWallet(userId, amount) {
  const { data: worker } = await getInformalWorkerByUserId(userId);
  if (!worker) throw new Error('Worker not found');
  
  const newBalance = (worker.wallet_balance || 0) + amount;
  
  return supabaseAdmin
    .from('informal_workers')
    .update({ 
      wallet_balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();
}

export async function getAllInformalWorkers(filters = {}) {
  let query = supabaseAdmin.from('informal_workers').select('*');
  
  if (filters.verification_status) {
    query = query.eq('verification_status', filters.verification_status);
  }
  
  if (filters.service_area) {
    query = query.eq('service_area', filters.service_area);
  }
  
  return query;
}
