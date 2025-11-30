'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  className?: string;
  sparkline?: number[];
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-safety-green-600',
  trend,
  loading,
  className,
  sparkline,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up' || (change && change > 0)) return TrendingUp;
    if (trend === 'down' || (change && change < 0)) return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trend === 'up' || (change && change > 0)) return 'text-green-600 dark:text-green-400';
    if (trend === 'down' || (change && change < 0)) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500';
  };

  const TrendIcon = getTrendIcon();

  if (loading) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6', className)}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6',
        'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        {Icon && (
          <div className={cn('p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50', iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {(change !== undefined || changeLabel) && (
            <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
              <TrendIcon className="w-4 h-4" />
              <span>
                {change !== undefined && `${change > 0 ? '+' : ''}${change}%`}
                {changeLabel && ` ${changeLabel}`}
              </span>
            </div>
          )}
        </div>

        {sparkline && sparkline.length > 0 && (
          <div className="w-20 h-10">
            <MiniSparkline data={sparkline} trend={trend} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Mini sparkline chart
function MiniSparkline({ data, trend }: { data: number[]; trend?: 'up' | 'down' | 'neutral' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = trend === 'down' ? '#ef4444' : trend === 'up' ? '#22c55e' : '#6b7280';

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Grid of stat cards
export function StatCardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', className)}>
      {children}
    </div>
  );
}
