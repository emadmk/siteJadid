import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';

async function getTaxExemptions() {
  const exemptions = await prisma.taxExemption.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          accountType: true,
        },
      },
    },
  });

  return exemptions;
}

export default async function TaxExemptionsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const exemptions = await getTaxExemptions();

  const approvedCount = exemptions.filter((e) => e.status === 'APPROVED').length;
  const expiringCount = exemptions.filter(
    (e) =>
      e.status === 'APPROVED' &&
      e.expirationDate &&
      new Date(e.expirationDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Exemptions</h1>
          <p className="text-gray-600 mt-1">
            Manage customer tax exemption certificates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {exemptions.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Approved</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {approvedCount}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-2">
            {exemptions.filter((e) => e.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-600">Expiring Soon</div>
          <div className="text-2xl font-bold text-orange-600 mt-2">
            {expiringCount}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Certificate #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Issuing State
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Exempt States
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expiration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exemptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No tax exemptions found
                </td>
              </tr>
            ) : (
              exemptions.map((exemption) => (
                <tr key={exemption.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">
                      {exemption.user.name || 'N/A'}
                    </div>
                    <div className="text-gray-500">{exemption.user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {exemption.certificateNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {exemption.issuingState}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {exemption.exemptStates.length > 0
                      ? exemption.exemptStates.join(', ')
                      : 'All states'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {exemption.expirationDate
                      ? new Date(exemption.expirationDate).toLocaleDateString()
                      : 'No expiration'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        exemption.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : exemption.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : exemption.status === 'EXPIRED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {exemption.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {exemption.certificateUrl && (
                      <a
                        href={exemption.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-safety-green-600 hover:text-safety-green-900"
                      >
                        View Cert
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
