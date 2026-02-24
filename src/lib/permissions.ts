// Role-based permission system

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'ACCOUNTANT'
  | 'CUSTOMER_SERVICE'
  | 'WAREHOUSE_MANAGER'
  | 'MARKETING_MANAGER'
  | 'CONTENT_MANAGER'
  | 'CUSTOMER'
  | 'B2B_CUSTOMER'
  | 'GSA_CUSTOMER';

export type Permission =
  | 'dashboard.view'
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'orders.view'
  | 'orders.manage'
  | 'customers.view'
  | 'customers.manage'
  | 'analytics.view'
  | 'accounting.view'
  | 'accounting.manage'
  | 'marketing.view'
  | 'marketing.manage'
  | 'inventory.view'
  | 'inventory.manage'
  | 'settings.view'
  | 'settings.manage';

// Define which roles have which permissions
const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'dashboard.view',
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'orders.view',
    'orders.manage',
    'customers.view',
    'customers.manage',
    'analytics.view',
    'accounting.view',
    'accounting.manage',
    'marketing.view',
    'marketing.manage',
    'inventory.view',
    'inventory.manage',
    'settings.view',
    'settings.manage',
  ],
  ADMIN: [
    'dashboard.view',
    'products.view',
    'products.create',
    'products.edit',
    'products.delete',
    'orders.view',
    'orders.manage',
    'customers.view',
    'customers.manage',
    'analytics.view',
    'accounting.view',
    'marketing.view',
    'marketing.manage',
    'inventory.view',
    'inventory.manage',
    'settings.view',
  ],
  ACCOUNTANT: [
    'dashboard.view',
    'orders.view',
    'customers.view',
    'analytics.view',
    'accounting.view',
    'accounting.manage',
  ],
  CUSTOMER_SERVICE: [
    'dashboard.view',
    'products.view',
    'products.edit',
    'orders.view',
    'orders.manage',
    'customers.view',
    'customers.manage',
  ],
  WAREHOUSE_MANAGER: [
    'dashboard.view',
    'products.view',
    'orders.view',
    'inventory.view',
    'inventory.manage',
  ],
  MARKETING_MANAGER: [
    'dashboard.view',
    'products.view',
    'customers.view',
    'analytics.view',
    'marketing.view',
    'marketing.manage',
  ],
  CONTENT_MANAGER: [
    'dashboard.view',
    'products.view',
    'products.create',
    'products.edit',
    'marketing.view',
    'marketing.manage',
  ],
  CUSTOMER: [],
  B2B_CUSTOMER: [],
  GSA_CUSTOMER: [],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function isAdminRole(role: UserRole): boolean {
  const adminRoles: UserRole[] = [
    'SUPER_ADMIN',
    'ADMIN',
    'ACCOUNTANT',
    'CUSTOMER_SERVICE',
    'WAREHOUSE_MANAGER',
    'MARKETING_MANAGER',
    'CONTENT_MANAGER',
  ];
  return adminRoles.includes(role);
}
