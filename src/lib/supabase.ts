import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabase;
}

// Helper to get current user + organization
export async function getCurrentUser() {
  const supabaseClient = getSupabase();
  if (!supabaseClient) return null;

  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error || !user) return null;

  return user;
}

// Helper to get organization_id from user metadata or JWT
export async function getOrganizationId(): Promise<string | null> {
  const supabaseClient = getSupabase();
  if (!supabaseClient) return null;

  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session?.user) return null;

  // Try to get org_id from user metadata first
  const orgIdFromMetadata = session.user.user_metadata?.organization_id;
  if (orgIdFromMetadata) return orgIdFromMetadata;

  // Fallback: try to get from JWT claims (if you set it during login)
  const orgIdFromJWT = (session.access_token as any)?.org_id;
  if (orgIdFromJWT) return orgIdFromJWT;

  return null;
}
