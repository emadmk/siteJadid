import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Plus, Shield, DollarSign } from 'lucide-react';

async function getTeamData(userId: string) {
  const b2bProfile = await db.b2BProfile.findUnique({
    where: { userId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          costCenter: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      costCenters: {
        where: {
          isActive: true,
        },
      },
    },
  });

  return { b2bProfile };
}

export default async function B2BTeamPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/b2b/team');
  }

  if (session.user.accountType !== 'B2B') {
    redirect('/account');
  }

  const { b2bProfile } = await getTeamData(session.user.id);

  if (!b2bProfile) {
    redirect('/account');
  }

  // Check if user is admin
  const userMember = b2bProfile.members.find((m) => m.userId === session.user.id);
  const isAdmin = userMember?.role === 'ACCOUNT_ADMIN';

  const roleLabels: Record<string, string> = {
    ACCOUNT_ADMIN: 'Account Admin',
    PURCHASER: 'Purchaser',
    APPROVER: 'Approver',
    VIEWER: 'Viewer',
    FINANCE: 'Finance',
  };

  const roleColors: Record<string, string> = {
    ACCOUNT_ADMIN: 'bg-red-100 text-red-800',
    PURCHASER: 'bg-blue-100 text-blue-800',
    APPROVER: 'bg-purple-100 text-purple-800',
    VIEWER: 'bg-gray-100 text-gray-800',
    FINANCE: 'bg-safety-green-100 text-safety-green-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Team Management</h1>
              <p className="text-gray-600">{b2bProfile.companyName}</p>
            </div>
            {isAdmin && (
              <Link href="/b2b/team/invite">
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" />
                  Invite Member
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Members</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-black">{b2bProfile.members.length}</div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Admins</span>
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-black">
              {b2bProfile.members.filter((m) => m.role === 'ACCOUNT_ADMIN').length}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Active Users</span>
              <Users className="w-5 h-5 text-safety-green-600" />
            </div>
            <div className="text-3xl font-bold text-black">
              {b2bProfile.members.filter((m) => m.isActive).length}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Cost Centers</span>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-black">{b2bProfile.costCenters.length}</div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-black">Team Members</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Center
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {b2bProfile.members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-black">{member.user.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{member.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
                        {roleLabels[member.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {member.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {member.costCenter?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {member.orderLimit ? `$${Number(member.orderLimit).toLocaleString()}` : 'Unlimited'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.isActive
                            ? 'bg-safety-green-100 text-safety-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/b2b/team/${member.id}/edit`}
                          className="text-safety-green-600 hover:text-safety-green-900"
                        >
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}

                {b2bProfile.members.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                      No team members yet. Invite members to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
