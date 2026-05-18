import { supabase } from '@/lib/supabase';
import { WorkerProfile } from '@/types';
import { PAGE_SIZE, PaginatedResult } from './jobService';

export async function fetchAvailableWorkers(opts: {
  municipality?: string;
  municipalities?: string[];
  category?: string;
  query?: string;
  page?: number;
}): Promise<PaginatedResult<WorkerProfile>> {
  const { municipality, municipalities, category, query, page = 0 } = opts;
  const from = page * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  let q = supabase
    .from('worker_profiles')
    .select('*', { count: 'exact' })
    .eq('available', true)
    .order('membership_tier', { ascending: false })
    .order('rating',           { ascending: false, nullsFirst: false })
    .range(from, to);

  if (municipalities && municipalities.length > 1) q = q.in('municipality', municipalities);
  else if (municipality) q = q.eq('municipality', municipality);
  if (category)     q = q.contains('trades', [category]);
  if (query?.trim()) q = q.ilike('full_name', `%${query.trim()}%`);

  const { data, error, count } = await q;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as WorkerProfile[],
    count: total,
    hasMore: (page + 1) * PAGE_SIZE < total,
  };
}

export async function fetchWorkerProfile(userId: string): Promise<WorkerProfile | null> {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data as WorkerProfile | null;
}

export async function fetchWorkerProfiles(userIds: string[]): Promise<any[]> {
  if (!userIds.length) return [];
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('user_id, full_name, trades, municipality, avatar_url, rating, reviews_count, whatsapp_number')
    .in('user_id', userIds);
  if (error) throw error;
  return data ?? [];
}

export async function fetchWorkerAvailability(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('available')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data?.available ?? true;
}

export async function updateWorkerAvailability(userId: string, available: boolean) {
  const { error } = await supabase
    .from('worker_profiles')
    .update({ available })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateWorkerAvatar(userId: string, avatarUrl: string) {
  const { error } = await supabase
    .from('worker_profiles')
    .update({ avatar_url: avatarUrl })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function fetchWorkerProfileForEdit(userId: string) {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('whatsapp_number, trades, bio, experience_years, photos')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateWorkerProfileData(userId: string, data: {
  full_name: string;
  municipality: string;
  whatsapp_number: string | null;
  trades: string[];
  bio: string;
  experience_years: number;
}) {
  const { error } = await supabase.from('worker_profiles').update(data).eq('user_id', userId);
  if (error) throw error;
}

export async function updateWorkerPhotos(userId: string, photos: string[]) {
  const { error } = await supabase
    .from('worker_profiles')
    .update({ photos })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function upsertWorkerOnboarding(data: {
  user_id: string;
  trades: string[];
  bio: string;
  experience_years: number;
  whatsapp_number: string;
  available: boolean;
  membership_tier: string;
  municipality: string;
  full_name: string;
  avatar_url: string | null;
  photos: string[];
}) {
  const { error } = await supabase.from('worker_profiles').upsert(data);
  if (error) throw error;
}
