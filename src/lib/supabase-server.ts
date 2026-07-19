import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { db } from "@/db";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export type Role = "admin" | "operator" | "inspector";

export interface AuthContext {
  userId: string;
  email: string;
  organizationId: string;
  role: Role;
}

export function isServerSupabaseConfigured(): boolean {
  return (
    !!supabaseUrl &&
    !!supabaseAnonKey &&
    !supabaseUrl.includes("your-supabase-project") &&
    supabaseAnonKey !== "your-anon-key"
  );
}

export async function getServerSupabase() {
  if (!isServerSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if called from a Server Component render path.
        }
      },
    },
  });
}

/**
 * Returns the verified Supabase auth user for this request, or null.
 *
 * Uses `auth.getUser()`, which round-trips to Supabase's auth server to
 * verify the token, rather than `auth.getSession()`, which only decodes
 * the locally-stored JWT. This is the check Supabase recommends for any
 * server-side code that gates access to data.
 *
 * There is no other way to authenticate here. No bypass cookie, no header
 * override, no email-based inference of identity or role. If this returns
 * null, the caller is not authenticated.
 */
async function getVerifiedUser() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user || !data.user.email) return null;
    return data.user;
  } catch (err) {
    console.error("Failed to verify Supabase session:", err);
    return null;
  }
}

/**
 * Resolves (and, for a brand-new identity, provisions) the app-level user
 * row tied to a verified Supabase user.
 *
 * A first-time identity is given its own new organization and made that
 * organization's admin, so distinct signups are isolated from each other
 * by default instead of being funneled into one shared tenant. Joining an
 * *existing* organization is a separate, explicit invite flow — never
 * inferred here, and never inferred from the user's email address.
 */
async function resolveAppUser(supaUser: { id: string; email: string }): Promise<AuthContext | null> {
  if (!db) {
    console.error("DATABASE_URL not configured; cannot resolve organization membership.");
    return null;
  }

  let rows = await db.select().from(users).where(eq(users.id, supaUser.id)).limit(1);

  if (rows.length === 0) {
    rows = await db.select().from(users).where(eq(users.email, supaUser.email)).limit(1);
  }

  if (rows.length === 0) {
    const org = await db
      .insert(organizations)
      .values({ name: `${supaUser.email.split("@")[0]}'s Organization` })
      .returning();

    rows = await db
      .insert(users)
      .values({
        id: supaUser.id,
        email: supaUser.email,
        role: "admin",
        organizationId: org[0].id,
      })
      .onConflictDoNothing()
      .returning();

    // Race with another request provisioning the same brand-new user: re-read.
    if (rows.length === 0) {
      rows = await db.select().from(users).where(eq(users.id, supaUser.id)).limit(1);
    }
  }

  const row = rows[0];
  if (!row?.organizationId) return null;

  return {
    userId: supaUser.id,
    email: row.email,
    organizationId: row.organizationId,
    role: (row.role as Role) || "operator",
  };
}

/**
 * Single source of truth for "who is calling and what can they see."
 * Every API route should call this once and use the result — never derive
 * organizationId or role from request bodies, query params, or headers.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supaUser = await getVerifiedUser();
  if (!supaUser || !supaUser.email) return null;
  return resolveAppUser({ id: supaUser.id, email: supaUser.email });
}

// --- Compatibility wrappers for existing route handlers ---

export async function getOrganizationId(): Promise<string | null> {
  const ctx = await getAuthContext();
  return ctx?.organizationId ?? null;
}

export async function getServerUserRole(): Promise<Role | null> {
  const ctx = await getAuthContext();
  return ctx?.role ?? null;
}

export async function getServerSession() {
  const supaUser = await getVerifiedUser();
  return supaUser ? { user: supaUser } : null;
}

/**
 * Convenience guard for routes that must be restricted to a role. Returns
 * the AuthContext on success, or null if the caller isn't authenticated or
 * doesn't have the required role — callers should turn a null into a 401
 * (no context) or 403 (wrong role) as appropriate.
 */
export async function requireRole(...allowed: Role[]): Promise<AuthContext | null> {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  if (!allowed.includes(ctx.role)) return null;
  return ctx;
}
