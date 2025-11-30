'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  User,
  LogOut,
  Search,
  Menu,
  Settings,
  HelpCircle,
  Command,
  ChevronDown,
  Package,
  ShoppingCart,
  Users,
  AlertCircle,
  Check,
  CreditCard,
  Star,
  Gift,
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './ui/ThemeToggle';
import { useCommandPalette } from './ui/CommandPalette';
import { useSidebar } from './AdminSidebar';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'ORDER_UPDATE':
      return <ShoppingCart className="w-4 h-4 text-blue-500" />;
    case 'SHIPMENT_UPDATE':
      return <Package className="w-4 h-4 text-purple-500" />;
    case 'PAYMENT_RECEIVED':
      return <CreditCard className="w-4 h-4 text-green-500" />;
    case 'REVIEW_SUBMITTED':
      return <Star className="w-4 h-4 text-yellow-500" />;
    case 'PROMOTION':
      return <Gift className="w-4 h-4 text-pink-500" />;
    case 'LOYALTY_UPDATE':
      return <Star className="w-4 h-4 text-orange-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
  }
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function AdminHeader() {
  const { data: session } = useSession();
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const { toggle: toggleSidebar } = useSidebar();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/notifications?limit=10');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    fetchNotifications();
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] }),
      });
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
      <div className="px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Search / Command Palette Trigger */}
          <div className="flex-1 max-w-xl hidden sm:block">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-xl text-left transition-colors group"
            >
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400 flex-1">
                Search products, orders, customers...
              </span>
              <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 group-hover:border-gray-300 dark:group-hover:border-gray-500 transition-colors">
                <Command className="w-3 h-3" />
                <span>K</span>
              </kbd>
            </button>
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="sm:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Right side */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Help */}
            <Link
              href="/admin/help"
              className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              title="Help & Documentation"
            >
              <HelpCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Link>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) fetchNotifications();
                }}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-green-600 dark:text-green-400 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {loading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm">Loading...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                              !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <NotificationIcon type={notification.type} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {notification.title}
                                  </p>
                                  {!notification.isRead && (
                                    <button
                                      onClick={() => markAsRead(notification.id)}
                                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                                      title="Mark as read"
                                    >
                                      <Check className="w-3 h-3 text-gray-400" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                      <Link
                        href="/admin/notifications"
                        className="block w-full text-center text-sm text-green-600 dark:text-green-400 hover:underline"
                        onClick={() => setShowNotifications(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 lg:gap-3 p-1.5 lg:pr-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-medium text-sm shadow-lg shadow-green-500/20">
                  {getUserInitials(session?.user?.name)}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {session?.user?.name || 'Admin'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {session?.user?.role?.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="hidden lg:block w-4 h-4 text-gray-400" />
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {/* User Info */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-medium">
                          {getUserInitials(session?.user?.name)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {session?.user?.name || 'Admin'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {session?.user?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        href="/admin/profile"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <Link
                        href="/admin/help"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Help & Support</span>
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
