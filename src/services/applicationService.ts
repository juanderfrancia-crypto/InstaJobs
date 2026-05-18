import { supabase } from '@/lib/supabase';

export async function applyToJob(data: {
  job_id: string;
  worker_id: string | undefined;
  message: string;
  status: string;
}) {
  const { error } = await supabase.from('job_applications').insert(data);
  if (error) throw error;
}

export async function checkApplication(jobId: string, workerId: string): Promise<boolean> {
  const { data } = await supabase
    .from('job_applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('worker_id', workerId)
    .maybeSingle();
  return !!data;
}

export async function cancelApplication(applicationId: string, workerId: string) {
  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', applicationId)
    .eq('worker_id', workerId);
  if (error) throw error;
}

export async function acceptApplication(appId: string, jobId: string) {
  const { data: job } = await supabase
    .from('job_posts')
    .select('status')
    .eq('id', jobId)
    .single();

  if (job?.status !== 'open') {
    throw new Error('Este trabajo ya fue asignado a otro trabajador');
  }

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from('job_applications').update({ status: 'accepted' }).eq('id', appId),
    supabase.from('job_posts').update({ status: 'in_progress' }).eq('id', jobId),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
}

export async function rejectApplication(appId: string) {
  const { error } = await supabase.from('job_applications').update({ status: 'rejected' }).eq('id', appId);
  if (error) throw error;
}

export async function fetchAppliedJobIds(
  workerId: string,
  jobIds: string[]
): Promise<Set<string>> {
  if (!jobIds.length) return new Set();
  const { data, error } = await supabase
    .from('job_applications')
    .select('job_id')
    .eq('worker_id', workerId)
    .in('job_id', jobIds);
  if (error) throw error;
  return new Set((data ?? []).map((a: any) => a.job_id as string));
}

export async function fetchPendingCounts(
  jobIds: string[]
): Promise<Record<string, number>> {
  if (!jobIds.length) return {};
  const { data, error } = await supabase
    .from('job_applications')
    .select('job_id')
    .in('job_id', jobIds)
    .eq('status', 'pending');
  if (error) throw error;
  const counts: Record<string, number> = {};
  (data ?? []).forEach((a: any) => {
    counts[a.job_id] = (counts[a.job_id] ?? 0) + 1;
  });
  return counts;
}

export async function fetchWorkerApplications(workerId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, status, message, created_at, job:job_posts(id, title, municipality, trade_category, status, client:users(full_name, phone))')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchWorkerActivityApplications(workerId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, status, message, created_at, job:job_posts(*, client:users(full_name))')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchJobApplicationsWithWorkers(jobId: string): Promise<any[]> {
  const { data: appData, error: appError } = await supabase
    .from('job_applications')
    .select('id, status, message, created_at, worker_id')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  if (appError) throw appError;
  if (!appData?.length) return [];

  const workerIds = [...new Set(appData.map((a: any) => a.worker_id))];
  const { data: workerData, error: workerError } = await supabase
    .from('worker_profiles')
    .select('user_id, full_name, trades, municipality, avatar_url, rating, reviews_count, whatsapp_number')
    .in('user_id', workerIds);
  if (workerError) throw workerError;

  const workerMap = Object.fromEntries((workerData ?? []).map((w: any) => [w.user_id, w]));
  return appData.map((a: any) => ({ ...a, worker: workerMap[a.worker_id] ?? null }));
}

export async function fetchWorkerChats(workerId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, status, created_at, job:job_posts(id, title, municipality, client:users(id, full_name, phone, avatar_url))')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function fetchClientChats(clientId: string): Promise<{
  jobs: any[];
  applications: any[];
  workerProfiles: any[];
}> {
  const { data: myJobs, error: je } = await supabase
    .from('job_posts')
    .select('id, title')
    .eq('client_id', clientId);
  if (je) throw je;
  if (!myJobs?.length) return { jobs: [], applications: [], workerProfiles: [] };

  const { data: apps, error: ae } = await supabase
    .from('job_applications')
    .select('id, status, created_at, job_id, worker_id')
    .in('job_id', myJobs.map((j: any) => j.id))
    .order('created_at', { ascending: false })
    .limit(50);
  if (ae) throw ae;

  const workerIds = [...new Set((apps ?? []).map((a: any) => a.worker_id))];
  const { data: workerProfiles } = workerIds.length
    ? await supabase
        .from('worker_profiles')
        .select('user_id, full_name, whatsapp_number, trades, avatar_url')
        .in('user_id', workerIds)
    : { data: [] };

  return { jobs: myJobs, applications: apps ?? [], workerProfiles: workerProfiles ?? [] };
}
