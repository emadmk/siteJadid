import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  // Allow admin roles to access admin panel
  const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CUSTOMER_SERVICE', 'WAREHOUSE_MANAGER', 'MARKETING_MANAGER', 'CONTENT_MANAGER'];

  if (!adminRoles.includes(session.user.role)) {
    redirect('/dashboard');
  }

  return <AdminLayout>{children}</AdminLayout>;
}
