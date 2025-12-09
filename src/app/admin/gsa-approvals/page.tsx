'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle, XCircle, Clock, Building2, User, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GSAUser {
  id: string;
  name: string | null;
  email: string;
  gsaDepartment: string | null;
  gsaApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  accountType: string;
  createdAt: string;
}

const DEPARTMENT_LABELS: Record<string, string> = {
  'DOW': 'Department of War (DOW)',
  'DLA': 'Defense Logistics Agency (DLA)',
  'USDA': 'US Department of Agriculture (USDA)',
  'NIH': 'National Institute of Health (NIH)',
  'GCSS-Army': 'Global Combat Support System-Army (GCSS-Army)',
};

export default function GSAApprovalsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<GSAUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/gsa-approvals');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching GSA users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(userId);
    try {
      const res = await fetch('/api/admin/gsa-approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });

      if (res.ok) {
        setUsers(users.map(user =>
          user.id === userId
            ? { ...user, gsaApprovalStatus: status }
            : user
        ));
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.gsaApprovalStatus === filter;
  });

  const stats = {
    pending: users.filter(u => u.gsaApprovalStatus === 'PENDING').length,
    approved: users.filter(u => u.gsaApprovalStatus === 'APPROVED').length,
    rejected: users.filter(u => u.gsaApprovalStatus === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-black">GSA Account Approvals</h1>
        </div>
        <p className="text-gray-600">Manage government account registration requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-colors ${filter === 'PENDING' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-black">{stats.pending}</span>
          </div>
          <div className="text-sm text-gray-600">Pending Approval</div>
        </div>

        <div
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-colors ${filter === 'APPROVED' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilter('APPROVED')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-black">{stats.approved}</span>
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>

        <div
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-colors ${filter === 'REJECTED' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilter('REJECTED')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-black">{stats.rejected}</span>
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All ({users.length})
        </Button>
        <Button
          variant={filter === 'PENDING' ? 'default' : 'outline'}
          onClick={() => setFilter('PENDING')}
          size="sm"
          className={filter === 'PENDING' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
        >
          Pending ({stats.pending})
        </Button>
        <Button
          variant={filter === 'APPROVED' ? 'default' : 'outline'}
          onClick={() => setFilter('APPROVED')}
          size="sm"
          className={filter === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          Approved ({stats.approved})
        </Button>
        <Button
          variant={filter === 'REJECTED' ? 'default' : 'outline'}
          onClick={() => setFilter('REJECTED')}
          size="sm"
          className={filter === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          Rejected ({stats.rejected})
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No GSA users found with the selected filter
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-black">{user.name || 'No name'}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {user.gsaDepartment ? DEPARTMENT_LABELS[user.gsaDepartment] || user.gsaDepartment : 'Not specified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.gsaApprovalStatus === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : user.gsaApprovalStatus === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.gsaApprovalStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.gsaApprovalStatus === 'PENDING' ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApproval(user.id, 'APPROVED')}
                            disabled={processingId === user.id}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            onClick={() => handleApproval(user.id, 'REJECTED')}
                            disabled={processingId === user.id}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproval(user.id, 'PENDING')}
                          disabled={processingId === user.id}
                        >
                          Reset to Pending
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
