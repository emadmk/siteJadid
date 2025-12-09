import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ShieldCheck, FileText, Package } from 'lucide-react';

export default async function GSADashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');

  const gsaProfile = await db.gSAProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!gsaProfile) redirect('/account');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">GSA Dashboard</h1>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <ShieldCheck className="w-8 h-8 text-blue-600 mb-4" />
          <div className="text-2xl font-bold">{gsaProfile.contractNumber || 'Pending'}</div>
          <div className="text-sm text-gray-600">Contract Number</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <FileText className="w-8 h-8 text-green-600 mb-4" />
          <div className="text-2xl font-bold">{gsaProfile.agencyName || 'N/A'}</div>
          <div className="text-sm text-gray-600">Agency</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <Package className="w-8 h-8 text-purple-600 mb-4" />
          <div className="text-2xl font-bold">{gsaProfile.isActive ? 'Active' : 'Inactive'}</div>
          <div className="text-sm text-gray-600">Status</div>
        </div>
      </div>
    </div>
  );
}
