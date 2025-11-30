import { db } from '@/lib/db';
import { DollarSign, TrendingUp } from 'lucide-react';

export default async function CustomerCreditPage() {
  const b2bProfiles = await db.b2BProfile.findMany({
    select: {
      id: true,
      companyName: true,
      creditLimit: true,
      creditUsed: true,
      user: { select: { email: true } },
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Customer Credit Dashboard</h1>
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Credit Limit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Available</th>
            </tr>
          </thead>
          <tbody>
            {b2bProfiles.map((profile: any) => {
              const available = Number(profile.creditLimit) - Number(profile.creditUsed);
              return (
                <tr key={profile.id}>
                  <td className="px-6 py-4">{profile.companyName}</td>
                  <td className="px-6 py-4">${Number(profile.creditLimit).toLocaleString()}</td>
                  <td className="px-6 py-4">${Number(profile.creditUsed).toLocaleString()}</td>
                  <td className="px-6 py-4">${available.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
