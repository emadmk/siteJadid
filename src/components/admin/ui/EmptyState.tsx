'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon, Package, Users, FileText, ShoppingCart, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4',
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="bg-safety-green-600 hover:bg-safety-green-700">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

// Pre-configured empty states
export function NoProductsState({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="No products found"
      description="Get started by adding your first product to the catalog."
      action={onAdd ? { label: 'Add Product', onClick: onAdd } : undefined}
    />
  );
}

export function NoCustomersState({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No customers yet"
      description="Customers will appear here once they register or place orders."
      action={onAdd ? { label: 'Add Customer', onClick: onAdd } : undefined}
    />
  );
}

export function NoOrdersState() {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="No orders found"
      description="Orders will appear here when customers make purchases."
    />
  );
}

export function NoDataState({ title = 'No data available' }: { title?: string }) {
  return (
    <EmptyState
      icon={FileText}
      title={title}
      description="There's nothing to display at the moment."
    />
  );
}
