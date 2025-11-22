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
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Products',
    icon: Package,
    children: [
      { title: 'All Products', href: '/admin/products', icon: Package },
      { title: 'Add Product', href: '/admin/products/new', icon: Package },
      { title: 'Categories', href: '/admin/categories', icon: FolderTree },
      { title: 'Inventory', href: '/admin/inventory', icon: Warehouse },
    ],
  },
  {
    title: 'Orders',
    icon: ShoppingCart,
    children: [
      { title: 'All Orders', href: '/admin/orders', icon: ShoppingCart },
      { title: 'Pending Orders', href: '/admin/orders?status=PENDING', icon: ShoppingCart },
      { title: 'Shipped Orders', href: '/admin/orders?status=SHIPPED', icon: ShoppingCart },
    ],
  },
  {
    title: 'Customers',
    icon: Users,
    children: [
      { title: 'All Customers', href: '/admin/customers', icon: Users },
      { title: 'B2B Customers', href: '/admin/customers/b2b', icon: Users },
      { title: 'GSA Customers', href: '/admin/customers/gsa', icon: Users },
      { title: 'GSA Approvals', href: '/admin/customers/gsa-approvals', icon: Users },
    ],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    children: [
      { title: 'Overview', href: '/admin/analytics', icon: TrendingUp },
      { title: 'Sales Report', href: '/admin/analytics/sales', icon: DollarSign },
      { title: 'Product Performance', href: '/admin/analytics/products', icon: Package },
      { title: 'Customer Insights', href: '/admin/analytics/customers', icon: Users },
    ],
  },
  {
    title: 'Accounting',
    icon: DollarSign,
    children: [
      { title: 'Revenue', href: '/admin/accounting/revenue', icon: DollarSign },
      { title: 'Payments', href: '/admin/accounting/payments', icon: DollarSign },
      { title: 'Invoices', href: '/admin/accounting/invoices', icon: FileText },
    ],
  },
  {
    title: 'Marketing',
    icon: Tag,
    children: [
      { title: 'Promotions', href: '/admin/promotions', icon: Tag },
      { title: 'Coupons', href: '/admin/coupons', icon: Tag },
    ],
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
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
        {isOpen && (
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

export function AdminSidebar() {
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
        {menuItems.map((item) => (
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
