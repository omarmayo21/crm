import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project-ref.supabase.co') &&
    !supabaseAnonKey.includes('your-anon-public-key-here')
  );
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    // Use placeholder valid syntax URL when env is not set yet so component mount doesn't crash before showing setup instructions
    const url = isSupabaseConfigured()
      ? supabaseUrl
      : 'https://placeholder-unconfigured.supabase.co';
    const key = isSupabaseConfigured()
      ? supabaseAnonKey
      : 'public-anon-placeholder-key';

    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
}
