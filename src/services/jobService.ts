import { supabase } from '@/lib/supabase';
import { JobPost } from '@/types';

export const PAGE_SIZE = 20;

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

export async function fetchOpenJobs(opts: {
  municipality?: string;
  category?: string;
  query?: string;
  page?: number;
}): Promise<PaginatedResult<JobPost>> {
  const { municipality, category, query, page = 0 } = opts;
  const from = page * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  let q = supabase
    .from('job_posts')
    .select('*, client:users(full_name, municipality)', { count: 'exact' })
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (municipality) q = q.eq('municipality', municipality);
  if (category)     q = q.eq('trade_category', category);
  if (query?.trim()) q = q.ilike('title', `%${query.trim()}%`);

  const { data, error, count } = await q;
  if (error) throw error;
  const total = count ?? 0;
  return {
    data: (data ?? []) as JobPost[],
    count: total,
    hasMore: (page + 1) * PAGE_SIZE < total,
  };
}

export async function createJob(data: {
  client_id: string | undefined;
  trade_category: string;
  title: string;
  description: string;
  municipality: string;
  urgency: string;
  urgency_detail: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  photos: string[];
}) {
  const { error } = await supabase.from('job_posts').insert(data);
  if (error) throw error;
}

export async function updateJob(
  jobId: string,
  updates: Partial<Pick<JobPost, 'trade_category' | 'title' | 'description' | 'municipality' | 'urgency' | 'budget_min' | 'budget_max' | 'photos'>> & { urgency_detail?: string | null }
) {
  const { error } = await supabase.from('job_posts').update(updates).eq('id', jobId);
  if (error) throw error;
}

export async function archiveJob(jobId: string) {
  const { error } = await supabase.from('job_posts').update({ status: 'cancelled' }).eq('id', jobId);
  if (error) throw error;
}

export async function deleteJob(jobId: string) {
  const { error } = await supabase.from('job_posts').delete().eq('id', jobId);
  if (error) throw error;
}

export async function completeJob(jobId: string) {
  const { error } = await supabase.from('job_posts').update({ status: 'completed' }).eq('id', jobId);
  if (error) throw error;
}

export async function fetchJobById(jobId: string): Promise<JobPost> {
  const { data, error } = await supabase.from('job_posts').select('*').eq('id', jobId).single();
  if (error) throw error;
  return data as JobPost;
}

export async function fetchClientJobs(clientId: string, statuses: string[]): Promise<JobPost[]> {
  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('client_id', clientId)
    .in('status', statuses)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as JobPost[];
}
