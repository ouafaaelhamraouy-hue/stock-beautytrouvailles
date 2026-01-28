import { UserRole } from '@prisma/client';

export const PERMISSIONS = {
  // Products
  PRODUCTS_READ: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  PRODUCTS_CREATE: ['SUPER_ADMIN', 'ADMIN'],
  PRODUCTS_UPDATE: ['SUPER_ADMIN', 'ADMIN'],
  PRODUCTS_DELETE: ['SUPER_ADMIN', 'ADMIN'],
  PRODUCTS_EDIT_COSTS: ['SUPER_ADMIN', 'ADMIN'], // Purchase costs editing

  // Arrivages (Shipments)
  ARRIVAGES_READ: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  ARRIVAGES_CREATE: ['SUPER_ADMIN', 'ADMIN'],
  ARRIVAGES_UPDATE: ['SUPER_ADMIN', 'ADMIN'],
  ARRIVAGES_DELETE: ['SUPER_ADMIN', 'ADMIN'],

  // Sales
  SALES_READ: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  SALES_CREATE: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  SALES_UPDATE: ['SUPER_ADMIN', 'ADMIN'],
  SALES_DELETE: ['SUPER_ADMIN', 'ADMIN'],

  // Stock Adjustments
  STOCK_ADJUST: ['SUPER_ADMIN', 'ADMIN', 'STAFF'], // All can adjust stock (audited)
  STOCK_READ: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],

  // Inventory
  INVENTORY_READ: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],

  // Expenses
  EXPENSES_READ: ['SUPER_ADMIN', 'ADMIN'],
  EXPENSES_CREATE: ['SUPER_ADMIN', 'ADMIN'],
  EXPENSES_UPDATE: ['SUPER_ADMIN', 'ADMIN'],
  EXPENSES_DELETE: ['SUPER_ADMIN', 'ADMIN'],

  // Dashboard
  DASHBOARD_READ: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],

  // Reports
  REPORTS_READ: ['SUPER_ADMIN', 'ADMIN', 'STAFF'],

  // Export
  EXPORT: ['SUPER_ADMIN', 'ADMIN'],

  // Settings
  SETTINGS_READ: ['SUPER_ADMIN', 'ADMIN'],
  SETTINGS_UPDATE: ['SUPER_ADMIN'],

  // Users
  USERS_READ: ['SUPER_ADMIN'],
  USERS_CREATE: ['SUPER_ADMIN'],
  USERS_UPDATE: ['SUPER_ADMIN'],
  USERS_DELETE: ['SUPER_ADMIN'],
  USERS_MANAGE_ROLES: ['SUPER_ADMIN'], // Can assign SUPER_ADMIN role
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(role);
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN';
}

/**
 * Check if user is admin (includes SUPER_ADMIN)
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/**
 * Check if user is staff
 */
export function isStaff(role: UserRole): boolean {
  return role === 'STAFF';
}

/**
 * Check if user can manage other users' roles
 * Only SUPER_ADMIN can assign SUPER_ADMIN role
 */
export function canManageRoles(userRole: UserRole): boolean {
  if (userRole !== 'SUPER_ADMIN') return false;
  // SUPER_ADMIN can manage any role
  return true;
}

/**
 * Check if user can access admin-only pages
 */
export function canAccessAdminPages(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN';
}
