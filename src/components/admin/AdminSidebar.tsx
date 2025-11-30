'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  BarChart3,
  DollarSign,
  Settings,
  FileText,
  Tag,
  Warehouse,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Layers,
  PackageX,
  ClipboardList,
  Star,
  Heart,
  FileCheck,
  Truck,
  Building2,
  Receipt,
  CreditCard,
  Image,
  Mail,
  Percent,
  RotateCcw,
  Calendar,
  BadgeCheck,
  Boxes,
  Link2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { hasAnyPermission, type UserRole, type Permission } from '@/lib/permissions';

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
  permissions?: Permission[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permissions: ['dashboard.view'],
  },
  {
    title: 'Products',
    icon: Package,
    permissions: ['products.view'],
    children: [
      { title: 'All Products', href: '/admin/products', icon: Package, permissions: ['products.view'] },
      { title: 'Add Product', href: '/admin/products/new', icon: Package, permissions: ['products.create'] },
      { title: 'Categories', href: '/admin/categories', icon: FolderTree, permissions: ['products.view'] },
      { title: 'Attributes', href: '/admin/attributes', icon: Layers, permissions: ['products.view'] },
      { title: 'Product Attributes', href: '/admin/product-attributes', icon: Layers, permissions: ['products.view'] },
      { title: 'Bundles', href: '/admin/bundles', icon: Boxes, permissions: ['products.view'] },
      { title: 'Inventory', href: '/admin/inventory', icon: Warehouse, permissions: ['inventory.view'] },
      { title: 'Backorders', href: '/admin/backorders', icon: PackageX, permissions: ['inventory.view'] },
    ],
  },
  {
    title: 'Orders',
    icon: ShoppingCart,
    permissions: ['orders.view'],
    children: [
      { title: 'All Orders', href: '/admin/orders', icon: ShoppingCart, permissions: ['orders.view'] },
      { title: 'Pending Orders', href: '/admin/orders?status=PENDING', icon: ShoppingCart, permissions: ['orders.view'] },
      { title: 'Shipped Orders', href: '/admin/orders?status=SHIPPED', icon: ShoppingCart, permissions: ['orders.view'] },
      { title: 'Backorders List', href: '/admin/backorders-list', icon: PackageX, permissions: ['orders.view'] },
      { title: 'RMAs', href: '/admin/rmas', icon: RotateCcw, permissions: ['orders.view'] },
    ],
  },
  {
    title: 'Customers',
    icon: Users,
    permissions: ['customers.view'],
    children: [
      { title: 'All Customers', href: '/admin/customers', icon: Users, permissions: ['customers.view'] },
      { title: 'B2B Customers', href: '/admin/customers/b2b', icon: Building2, permissions: ['customers.view'] },
      { title: 'GSA Customers', href: '/admin/customers/gsa', icon: BadgeCheck, permissions: ['customers.view'] },
      { title: 'GSA Approvals', href: '/admin/customers/gsa-approvals', icon: FileCheck, permissions: ['customers.manage'] },
      { title: 'Customer Groups', href: '/admin/customers/groups', icon: Users, permissions: ['customers.view'] },
      { title: 'Customer Credit', href: '/admin/customer-credit', icon: CreditCard, permissions: ['customers.manage'] },
    ],
  },
  {
    title: 'Quotes',
    href: '/admin/quotes',
    icon: FileText,
    permissions: ['orders.view'],
  },
  {
    title: 'Contracts',
    href: '/admin/contracts',
    icon: FileCheck,
    permissions: ['orders.view'],
  },
  {
    title: 'Purchase Orders',
    href: '/admin/purchase-orders',
    icon: ClipboardList,
    permissions: ['inventory.view'],
  },
  {
    title: 'Suppliers',
    href: '/admin/suppliers',
    icon: Truck,
    permissions: ['inventory.view'],
  },
  {
    title: 'Warehouses',
    href: '/admin/warehouses',
    icon: Warehouse,
    permissions: ['inventory.view'],
  },
  {
    title: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: Calendar,
    permissions: ['orders.view'],
  },
  {
    title: 'Reviews',
    href: '/admin/reviews',
    icon: Star,
    permissions: ['products.view'],
  },
  {
    title: 'Wishlists',
    href: '/admin/wishlists',
    icon: Heart,
    permissions: ['customers.view'],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    permissions: ['analytics.view'],
    children: [
      { title: 'Overview', href: '/admin/analytics', icon: TrendingUp, permissions: ['analytics.view'] },
      { title: 'Sales Report', href: '/admin/analytics/sales', icon: DollarSign, permissions: ['analytics.view'] },
      { title: 'Product Performance', href: '/admin/analytics/products', icon: Package, permissions: ['analytics.view'] },
      { title: 'Customer Insights', href: '/admin/analytics/customers', icon: Users, permissions: ['analytics.view'] },
    ],
  },
  {
    title: 'Accounting',
    icon: DollarSign,
    permissions: ['accounting.view'],
    children: [
      { title: 'Revenue', href: '/admin/accounting/revenue', icon: DollarSign, permissions: ['accounting.view'] },
      { title: 'Payments', href: '/admin/accounting/payments', icon: Receipt, permissions: ['accounting.view'] },
      { title: 'Invoices', href: '/admin/accounting/invoices', icon: FileText, permissions: ['accounting.view'] },
      { title: 'Tax Exemptions', href: '/admin/tax-exemptions', icon: Percent, permissions: ['accounting.view'] },
      { title: 'Commissions', href: '/admin/commissions', icon: DollarSign, permissions: ['accounting.view'] },
    ],
  },
  {
    title: 'Marketing',
    icon: Tag,
    permissions: ['marketing.view'],
    children: [
      { title: 'Promotions', href: '/admin/promotions', icon: Tag, permissions: ['marketing.view'] },
      { title: 'Coupons', href: '/admin/coupons', icon: Percent, permissions: ['marketing.view'] },
      { title: 'Banners', href: '/admin/marketing/banners', icon: Image, permissions: ['marketing.view'] },
      { title: 'Email Marketing', href: '/admin/marketing/emails', icon: Mail, permissions: ['marketing.view'] },
    ],
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    permissions: ['analytics.view'],
  },
  {
    title: 'Settings',
    icon: Settings,
    permissions: ['settings.view'],
    children: [
      { title: 'General', href: '/admin/settings', icon: Settings, permissions: ['settings.view'] },
      { title: 'Integrations', href: '/admin/settings/integrations', icon: Link2, permissions: ['settings.view'] },
    ],
  },
];

function SidebarMenuItem({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href === pathname;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors rounded-lg',
            'hover:bg-gray-100 text-gray-700'
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-5 h-5" />
            <span>{item.title}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {isOpen && item.children && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children.map((child) => (
              <SidebarMenuItem key={child.title} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href || '#'}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors rounded-lg',
        isActive
          ? 'bg-safety-green-600 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <item.icon className="w-5 h-5" />
      <span>{item.title}</span>
    </Link>
  );
}

export function AdminSidebar({ userRole }: { userRole?: UserRole }) {
  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter((item) => {
    if (!userRole || !item.permissions) return true;
    return hasAnyPermission(userRole, item.permissions);
  }).map((item) => {
    if (item.children && userRole) {
      return {
        ...item,
        children: item.children.filter((child) => {
          if (!child.permissions) return true;
          return hasAnyPermission(userRole, child.permissions);
        }),
      };
    }
    return item;
  });

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-safety-green-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg text-black">Admin Panel</div>
            <div className="text-xs text-gray-600">SafetyPro Store</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {filteredMenuItems.map((item) => (
          <SidebarMenuItem key={item.title} item={item} />
        ))}
      </nav>

      {/* Quick Stats */}
      <div className="p-4 m-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs font-medium text-gray-600 mb-2">Quick Stats</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Today's Orders</span>
            <span className="font-bold text-black">-</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Revenue</span>
            <span className="font-bold text-safety-green-600">-</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
