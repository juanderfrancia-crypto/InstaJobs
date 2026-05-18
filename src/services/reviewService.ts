import { supabase } from '@/lib/supabase';
import { Review } from '@/types';

export interface ClientProfileData {
  client: any;
  allJobs: any[];
  recentJobs: any[];
  reviews: any[];
}

export async function submitReview(data: {
  job_id: string;
  reviewer_id: string | undefined;
  reviewed_id: string;
  rating: number;
  comment: string;
}) {
  const { error } = await supabase.from('reviews').insert(data);
  if (error) throw error;
}

export async function fetchReviewsByTarget(userId: string, limit = 20): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:users_public!reviewer_id(full_name)')
    .eq('reviewed_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function fetchClientProfileData(clientId: string): Promise<ClientProfileData> {
  const [
    { data: client, error: ue },
    { data: allJobs },
    { data: recentJobs },
    { data: reviews },
  ] = await Promise.all([
    supabase
      .from('users_public')
      .select('id, full_name, municipality, avatar_url, verified_phone, verified_id, created_at')
      .eq('id', clientId)
      .single(),
    supabase.from('job_posts').select('status').eq('client_id', clientId),
    supabase
      .from('job_posts')
      .select('id, title, municipality, trade_category, status, created_at')
      .eq('client_id', clientId)
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer:users_public(full_name)')
      .eq('reviewed_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);
  if (ue) throw ue;
  return {
    client,
    allJobs: allJobs ?? [],
    recentJobs: recentJobs ?? [],
    reviews: reviews ?? [],
  };
}
