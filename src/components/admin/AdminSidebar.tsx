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
  ChevronLeft,
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
  Menu,
  X,
  Upload,
  Trash2,
} from 'lucide-react';
import { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { hasAnyPermission, type UserRole, type Permission } from '@/lib/permissions';

// Sidebar context for collapse state
interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
  toggle: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

// Provider component for external use
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = () => setMobileOpen(prev => !prev);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

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
      { title: 'Product Review', href: '/admin/products/review', icon: ClipboardList, permissions: ['products.edit'] },
      { title: 'Bulk Import', href: '/admin/products/import', icon: Upload, permissions: ['products.create'] },
      { title: 'Delete Products', href: '/admin/products/delete', icon: Trash2, permissions: ['products.delete'] },
      { title: 'Categories', href: '/admin/categories', icon: FolderTree, permissions: ['products.view'] },
      { title: 'Brands', href: '/admin/products/brands', icon: Building2, permissions: ['products.view'] },
      { title: 'Attributes', href: '/admin/attributes', icon: Layers, permissions: ['products.view'] },
      { title: 'Bundles', href: '/admin/bundles', icon: Boxes, permissions: ['products.view'] },
      { title: 'Inventory', href: '/admin/inventory', icon: Warehouse, permissions: ['inventory.view'] },
    ],
  },
  {
    title: 'Orders',
    icon: ShoppingCart,
    permissions: ['orders.view'],
    children: [
      { title: 'All Orders', href: '/admin/orders', icon: ShoppingCart, permissions: ['orders.view'] },
      { title: 'Backorders', href: '/admin/backorders-list', icon: PackageX, permissions: ['orders.view'] },
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
      { title: 'Customer Groups', href: '/admin/customers/groups', icon: Users, permissions: ['customers.view'] },
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
    title: 'Reviews',
    href: '/admin/reviews',
    icon: Star,
    permissions: ['products.view'],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    permissions: ['analytics.view'],
    children: [
      { title: 'Overview', href: '/admin/analytics', icon: TrendingUp, permissions: ['analytics.view'] },
      { title: 'Sales', href: '/admin/analytics/sales', icon: DollarSign, permissions: ['analytics.view'] },
      { title: 'Products', href: '/admin/analytics/products', icon: Package, permissions: ['analytics.view'] },
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
    ],
  },
  {
    title: 'Marketing',
    icon: Tag,
    permissions: ['marketing.view'],
    children: [
      { title: 'Coupons', href: '/admin/coupons', icon: Percent, permissions: ['marketing.view'] },
      { title: 'Banners', href: '/admin/marketing/banners', icon: Image, permissions: ['marketing.view'] },
      { title: 'Emails', href: '/admin/marketing/emails', icon: Mail, permissions: ['marketing.view'] },
    ],
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
  const { collapsed } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href === pathname || (item.href && pathname?.startsWith(item.href + '/'));
  const isChildActive = item.children?.some(child =>
    child.href === pathname || (child.href && pathname?.startsWith(child.href + '/'))
  );

  // Auto-open if child is active
  useState(() => {
    if (isChildActive) setIsOpen(true);
  });

  if (hasChildren) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            isChildActive
              ? 'text-safety-green-600 dark:text-safety-green-400 bg-safety-green-50 dark:bg-safety-green-900/20'
              : 'text-gray-700 dark:text-gray-300',
            collapsed && 'justify-center px-2'
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className={cn('w-5 h-5 flex-shrink-0', isChildActive && 'text-safety-green-600 dark:text-safety-green-400')} />
            {!collapsed && <span>{item.title}</span>}
          </div>
          {!collapsed && (
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}
        </button>

        <AnimatePresence>
          {isOpen && !collapsed && item.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-4 mt-1 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                {item.children.map((child) => (
                  <SidebarMenuItem key={child.title} item={child} depth={depth + 1} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href || '#'}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
        isActive
          ? 'bg-safety-green-600 text-white shadow-lg shadow-safety-green-600/25'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
        collapsed && 'justify-center px-2'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute inset-0 bg-safety-green-600 rounded-xl"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-3">
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>{item.title}</span>}
      </span>

      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md
                        opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
          {item.title}
        </div>
      )}
    </Link>
  );
}

export function AdminSidebar({ userRole }: { userRole?: UserRole }) {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();

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
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg lg:hidden"
      >
        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto',
          'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800',
          'flex flex-col overflow-hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-safety-green-500 to-safety-green-700 rounded-xl flex items-center justify-center shadow-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="font-bold text-gray-900 dark:text-white">SafetyPro</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</div>
              </motion.div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {filteredMenuItems.map((item) => (
            <SidebarMenuItem key={item.title} item={item} />
          ))}
        </nav>

        {/* Collapse button */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
              'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
              collapsed && 'justify-center'
            )}
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
              <ChevronLeft className="w-5 h-5" />
            </motion.div>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
