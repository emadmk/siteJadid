import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Building2 } from 'lucide-react';

export default async function ContractsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');
  
  const contracts = await db.contract.findMany({
    include: {
      b2bProfile: { select: { companyName: true } },
      gsaProfile: { select: { agencyName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contract Management</h1>
        <p className="text-gray-600">Manage B2B and GSA contracts</p>
      </div>
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Contract #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c: any) => (
              <tr key={c.id}>
                <td className="px-6 py-4">{c.contractNumber}</td>
                <td className="px-6 py-4">{c.b2bProfile?.companyName || c.gsaProfile?.agencyName}</td>
                <td className="px-6 py-4">{c.b2bProfileId ? 'B2B' : 'GSA'}</td>
                <td className="px-6 py-4">${Number(c.value).toFixed(2)}</td>
                <td className="px-6 py-4">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
