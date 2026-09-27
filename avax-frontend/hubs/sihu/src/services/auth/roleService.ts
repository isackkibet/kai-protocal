import { HubRole, HubUser, RolePermissions } from '@/types/publishing';

const ROLE_PERMISSIONS: Record<HubRole, RolePermissions> = {
  CHAIRPERSON: {
    canCreateDraft: true,
    canSubmitArticle: true,
    canReviewQueue: true,
    canApproveArticle: true,
    canRejectArticle: true,
    canRequestChanges: true,
    canPublishDirectly: true,
    canManageRoles: true,
    canViewAuditLogs: true,
    canViewFinancials: true,
    canDeleteAnyArticle: true,
  },
  SECRETARY: {
    canCreateDraft: true,
    canSubmitArticle: true,
    canReviewQueue: false,
    canApproveArticle: false,
    canRejectArticle: false,
    canRequestChanges: false,
    canPublishDirectly: false,
    canManageRoles: false,
    canViewAuditLogs: true,
    canViewFinancials: false,
    canDeleteAnyArticle: false,
  },
  TREASURER: {
    canCreateDraft: true,
    canSubmitArticle: true,
    canReviewQueue: false,
    canApproveArticle: false,
    canRejectArticle: false,
    canRequestChanges: false,
    canPublishDirectly: false,
    canManageRoles: false,
    canViewAuditLogs: true,
    canViewFinancials: true,
    canDeleteAnyArticle: false,
  },
  EDITOR: {
    canCreateDraft: true,
    canSubmitArticle: true,
    canReviewQueue: true,
    canApproveArticle: true,
    canRejectArticle: true,
    canRequestChanges: true,
    canPublishDirectly: false,
    canManageRoles: false,
    canViewAuditLogs: true,
    canViewFinancials: false,
    canDeleteAnyArticle: true,
  },
  VERIFIED_CONTRIBUTOR: {
    canCreateDraft: true,
    canSubmitArticle: true,
    canReviewQueue: false,
    canApproveArticle: false,
    canRejectArticle: false,
    canRequestChanges: false,
    canPublishDirectly: false,
    canManageRoles: false,
    canViewAuditLogs: false,
    canViewFinancials: false,
    canDeleteAnyArticle: false,
  },
  CONTRIBUTOR: {
    canCreateDraft: true,
    canSubmitArticle: true,
    canReviewQueue: false,
    canApproveArticle: false,
    canRejectArticle: false,
    canRequestChanges: false,
    canPublishDirectly: false,
    canManageRoles: false,
    canViewAuditLogs: false,
    canViewFinancials: false,
    canDeleteAnyArticle: false,
  },
  READER: {
    canCreateDraft: false,
    canSubmitArticle: false,
    canReviewQueue: false,
    canApproveArticle: false,
    canRejectArticle: false,
    canRequestChanges: false,
    canPublishDirectly: false,
    canManageRoles: false,
    canViewAuditLogs: false,
    canViewFinancials: false,
    canDeleteAnyArticle: false,
  },
};

const DEFAULT_USER: HubUser = {
  id: 'usr_founder_01',
  name: 'Austin Namuye',
  email: 'austinnamuye@gmail.com',
  role: 'CHAIRPERSON',
  isVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  pointsEarned: 1250,
  articlesCount: 5,
};

const USER_STORAGE_KEY = 'sihu_current_hub_user';

export const roleService = {
  /**
   * Get permissions for any role
   */
  getPermissions(role: HubRole): RolePermissions {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.READER;
  },

  /**
   * Check if a specific role has a given permission
   */
  can(role: HubRole, permission: keyof RolePermissions): boolean {
    const perms = this.getPermissions(role);
    return Boolean(perms[permission]);
  },

  /**
   * Get current authenticated user session (with fallback)
   */
  getCurrentUser(): HubUser {
    if (typeof window === 'undefined') return DEFAULT_USER;
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
        return DEFAULT_USER;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USER;
    }
  },

  /**
   * Update or switch active user / role
   */
  setCurrentUser(user: Partial<HubUser>): HubUser {
    const current = this.getCurrentUser();
    const updated: HubUser = { ...current, ...user };
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  },

  /**
   * Quick role switch utility (useful for testing Contributor vs Editor view)
   */
  switchRole(newRole: HubRole): HubUser {
    return this.setCurrentUser({
      role: newRole,
      isVerified: newRole === 'CHAIRPERSON' || newRole === 'EDITOR' || newRole === 'VERIFIED_CONTRIBUTOR',
    });
  },

  /**
   * Human readable badge formatting
   */
  getRoleBadge(role: HubRole): { label: string; bg: string; text: string } {
    switch (role) {
      case 'CHAIRPERSON':
        return { label: 'Chairperson', bg: '#4A2A0A', text: '#F59E0B' };
      case 'EDITOR':
        return { label: 'Editor', bg: '#102A1E', text: '#10B981' };
      case 'SECRETARY':
        return { label: 'Secretary', bg: '#1E1B4B', text: '#818CF8' };
      case 'TREASURER':
        return { label: 'Treasurer', bg: '#064E3B', text: '#34D399' };
      case 'VERIFIED_CONTRIBUTOR':
        return { label: 'Verified Contributor', bg: '#1E293B', text: '#38BDF8' };
      case 'CONTRIBUTOR':
        return { label: 'Contributor', bg: '#18181B', text: '#A1A1AA' };
      default:
        return { label: 'Reader', bg: '#18181B', text: '#71717A' };
    }
  },
};
