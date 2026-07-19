import { SupabaseClient } from '@supabase/supabase-js';

export type UserRole = 'owner' | 'admin' | 'operator' | 'viewer';

export interface OrganizationMembership {
  organization_id: string;
  role: UserRole;
}

/**
 * Get all organizations the current user belongs to + their role in each
 */
export async function getUserMemberships(
  supabase: SupabaseClient,
  userId: string
): Promise<OrganizationMembership[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId);

  if (error) {
    console.error('[RBAC] Failed to load memberships:', error);
    return [];
  }
  return data || [];
}

/**
 * Check if user has the required minimum role in a specific organization
 */
export function hasMinimumRole(
  memberships: OrganizationMembership[],
  organizationId: string,
  requiredRole: UserRole
): boolean {
  const membership = memberships.find(m => m.organization_id === organizationId);
  if (!membership) return false;

  const hierarchy: Record<UserRole, number> = {
    owner: 4,
    admin: 3,
    operator: 2,
    viewer: 1,
  };

  return hierarchy[membership.role] >= hierarchy[requiredRole];
}

/**
 * Get the user's highest role across all their organizations (useful for UI)
 */
export function getHighestRole(memberships: OrganizationMembership[]): UserRole | null {
  if (memberships.length === 0) return null;

  const hierarchy: Record<UserRole, number> = {
    owner: 4,
    admin: 3,
    operator: 2,
    viewer: 1,
  };

  return memberships.reduce((highest, current) => {
    return hierarchy[current.role] > hierarchy[highest] ? current.role : highest;
  }, 'viewer' as UserRole);
}
