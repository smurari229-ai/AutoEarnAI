import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Request } from 'express';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;

export function getSupabaseClient(): SupabaseClient | null {
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getAuthenticatedUser(req: Request): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) return null;

  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user;
}
