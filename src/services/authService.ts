import { supabase } from '@/lib/supabase';

export async function sendOtp(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({ phone: `+57${phone}` });
  if (error) throw error;
}

export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: `+57${phone}`,
    token,
    type: 'sms',
  });
  if (error) throw error;
  return data;
}

export async function getAuthUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}
