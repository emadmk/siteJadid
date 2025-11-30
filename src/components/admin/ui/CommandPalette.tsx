'use client';

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  FileText,
  Tag,
  Warehouse,
  Star,
  Heart,
  Truck,
  CreditCard,
  X,
} from 'lucide-react';

// Command Palette Context
interface CommandPaletteContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
});

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(prev => !prev);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const navigationItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', keywords: ['home', 'main'] },
  { icon: Package, label: 'Products', href: '/admin/products', keywords: ['items', 'catalog'] },
  { icon: ShoppingCart, label: 'Orders', href: '/admin/orders', keywords: ['sales', 'purchases'] },
  { icon: Users, label: 'Customers', href: '/admin/customers', keywords: ['users', 'clients'] },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics', keywords: ['reports', 'stats'] },
  { icon: Tag, label: 'Coupons', href: '/admin/coupons', keywords: ['discounts', 'promo'] },
  { icon: Warehouse, label: 'Inventory', href: '/admin/inventory', keywords: ['stock', 'warehouse'] },
  { icon: Star, label: 'Reviews', href: '/admin/reviews', keywords: ['ratings', 'feedback'] },
  { icon: Heart, label: 'Wishlists', href: '/admin/wishlists', keywords: ['favorites', 'saved'] },
  { icon: Truck, label: 'Suppliers', href: '/admin/suppliers', keywords: ['vendors', 'manufacturers'] },
  { icon: FileText, label: 'Quotes', href: '/admin/quotes', keywords: ['proposals', 'estimates'] },
  { icon: CreditCard, label: 'Payments', href: '/admin/accounting/payments', keywords: ['transactions', 'money'] },
  { icon: Settings, label: 'Settings', href: '/admin/settings', keywords: ['config', 'preferences'] },
];

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const context = useCommandPalette();
  const [search, setSearch] = useState('');
  const router = useRouter();

  const open = controlledOpen !== undefined ? controlledOpen : context.open;
  const setOpen = onOpenChange || context.setOpen;

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  const handleSelect = useCallback((href: string) => {
    router.push(href);
    setOpen(false);
    setSearch('');
  }, [router, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Command Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
          >
            <Command className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
                <Search className="w-5 h-5 text-gray-400" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search pages..."
                  className="flex-1 h-14 px-4 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-gray-500">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {navigationItems.map((item) => (
                    <Command.Item
                      key={item.href}
                      value={`${item.label} ${item.keywords.join(' ')}`}
                      onSelect={() => handleSelect(item.href)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                                 text-gray-700 dark:text-gray-300
                                 hover:bg-gray-100 dark:hover:bg-gray-800
                                 data-[selected=true]:bg-safety-green-50 dark:data-[selected=true]:bg-safety-green-900/20
                                 data-[selected=true]:text-safety-green-700 dark:data-[selected=true]:text-safety-green-400"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500">esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

