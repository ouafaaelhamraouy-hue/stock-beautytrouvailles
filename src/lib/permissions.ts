import { UserRole } from '@prisma/client';

export const PERMISSIONS = {
  // Products
  PRODUCTS_READ: ['ADMIN', 'STAFF'],
  PRODUCTS_CREATE: ['ADMIN'],
  PRODUCTS_UPDATE: ['ADMIN'],
  PRODUCTS_DELETE: ['ADMIN'],

  // Shipments
  SHIPMENTS_READ: ['ADMIN', 'STAFF'],
  SHIPMENTS_CREATE: ['ADMIN'],
  SHIPMENTS_UPDATE: ['ADMIN'],
  SHIPMENTS_DELETE: ['ADMIN'],

  // Sales
  SALES_READ: ['ADMIN', 'STAFF'],
  SALES_CREATE: ['ADMIN', 'STAFF'],
  SALES_UPDATE: ['ADMIN'],
  SALES_DELETE: ['ADMIN'],

  // Inventory
  INVENTORY_READ: ['ADMIN', 'STAFF'],

  // Expenses
  EXPENSES_READ: ['ADMIN'],
  EXPENSES_CREATE: ['ADMIN'],
  EXPENSES_UPDATE: ['ADMIN'],
  EXPENSES_DELETE: ['ADMIN'],

  // Dashboard
  DASHBOARD_READ: ['ADMIN', 'STAFF'],

  // Reports
  REPORTS_READ: ['ADMIN', 'STAFF'],

  // Settings
  SETTINGS_READ: ['ADMIN'],
  SETTINGS_UPDATE: ['ADMIN'],

  // Users
  USERS_READ: ['ADMIN'],
  USERS_CREATE: ['ADMIN'],
  USERS_UPDATE: ['ADMIN'],
  USERS_DELETE: ['ADMIN'],
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
 * Check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}

/**
 * Check if user is staff
 */
export function isStaff(role: UserRole): boolean {
  return role === 'STAFF';
}
