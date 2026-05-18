import { supabase } from '@/lib/supabase';

export async function fetchUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, municipality, avatar_url, verified_phone, verified_id, created_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateUser(
  userId: string,
  updates: Partial<{ full_name: string; municipality: string; avatar_url: string; push_token: string }>
) {
  const { error } = await supabase.from('users').update(updates).eq('id', userId);
  if (error) throw error;
}

export async function upsertOnboardingUser(data: {
  id: string;
  phone: string | undefined;
  full_name: string;
  role: string;
  municipality: string;
  avatar_url: string | null;
  verified_phone: boolean;
  verified_id: boolean;
}) {
  const { error } = await supabase.from('users').upsert(data);
  if (error) throw error;
}

export async function updatePushToken(userId: string, token: string) {
  const { error } = await supabase.from('users').update({ push_token: token }).eq('id', userId);
  if (error) throw error;
}
