'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import { AdminSidebar, SidebarProvider } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { CommandPalette, CommandPaletteProvider } from './ui/CommandPalette';
import { motion } from 'framer-motion';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role as any;

  return (
    <CommandPaletteProvider>
      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
          <AdminSidebar userRole={userRole} />
          <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
            <AdminHeader />
            <motion.main
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-auto p-4 lg:p-6"
            >
              {children}
            </motion.main>
          </div>
          <CommandPalette />
        </div>
      </SidebarProvider>
    </CommandPaletteProvider>
  );
}
