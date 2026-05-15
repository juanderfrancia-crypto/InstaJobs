export type UserRole = 'client' | 'worker';

export interface User {
  id: string;
  phone: string;
  full_name: string;
  role: UserRole;
  municipality: string;
  avatar_url?: string;
  verified_phone: boolean;
  verified_id: boolean;
  created_at: string;
}

export interface WorkerProfile {
  id: string;
  user_id: string;
  trades: string[];
  bio: string;
  experience_years: number;
  whatsapp_number: string;
  available: boolean;
  membership_tier: 'free' | 'premium';
  photos: string[];
  municipality: string;
  full_name: string;
  avatar_url?: string;
  rating?: number;
  reviews_count?: number;
  jobs_completed?: number;
  verified_phone?: boolean;
  verified_id?: boolean;
  distance_km?: number;
}

export interface JobPost {
  id: string;
  client_id: string;
  trade_category: string;
  title: string;
  description: string;
  municipality: string;
  urgency: 'today' | 'week' | 'flexible';
  budget_min?: number;
  budget_max?: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  photos: string[];
  created_at: string;
  client?: User;
  applications_count?: number;
}

export interface JobApplication {
  id: string;
  job_id: string;
  worker_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  worker?: WorkerProfile;
  job?: JobPost;
}

export interface Review {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer?: User;
}
