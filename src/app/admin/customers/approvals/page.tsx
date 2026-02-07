'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Users, ArrowLeft, Check, X, Loader2, Mail, Building2 } from 'lucide-react';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ApprovalsPage() {
  const { data, error, isLoading } = useSWR('/api/admin/pending-approvals', fetcher);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApproval = async (userId: string, action: 'approve' | 'reject') => {
    setProcessingId(userId);
    try {
      const res = await fetch('/api/admin/user-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });

      if (res.ok) {
        mutate('/api/admin/pending-approvals');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to process approval');
      }
    } catch (error) {
      alert('Failed to process approval');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-safety-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Failed to load pending approvals
        </div>
      </div>
    );
  }

  const pendingUsers = data?.users || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/customers">
          <Button variant="outline" className="mb-4 border-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Customers
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-black mb-2">Pending Approvals</h1>
        <p className="text-gray-600">
          Review and approve Volume Buyer and Government account requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {pendingUsers.length}
          </div>
          <div className="text-sm text-gray-600">Total Pending</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {pendingUsers.filter((u: any) => ['B2B', 'VOLUME_BUYER'].includes(u.accountType)).length}
          </div>
          <div className="text-sm text-gray-600">Volume Buyers</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-safety-green-600 mb-1">
            {pendingUsers.filter((u: any) => ['GSA', 'GOVERNMENT'].includes(u.accountType)).length}
          </div>
          <div className="text-sm text-gray-600">Government</div>
        </div>
      </div>

      {/* Pending Users */}
      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Check className="w-16 h-16 text-safety-green-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">All caught up!</h3>
          <p className="text-gray-600">No pending approvals at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user: any) => {
            const isGovernment = ['GSA', 'GOVERNMENT'].includes(user.accountType);
            const department = user.governmentDepartment || user.gsaDepartment;

            return (
              <div
                key={user.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isGovernment ? 'bg-safety-green-100' : 'bg-purple-100'
                      }`}
                    >
                      {isGovernment ? (
                        <Shield className="w-6 h-6 text-safety-green-600" />
                      ) : (
                        <Users className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-black">{user.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isGovernment
                              ? 'bg-safety-green-100 text-safety-green-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {isGovernment ? 'Government' : 'Volume Buyer'}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                        {user.companyName && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4" />
                            {user.companyName}
                          </div>
                        )}
                        {department && (
                          <div className="text-sm text-gray-500">
                            Department: {department}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Registered: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproval(user.id, 'approve')}
                      disabled={processingId === user.id}
                      className="bg-safety-green-600 hover:bg-safety-green-700"
                    >
                      {processingId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleApproval(user.id, 'reject')}
                      disabled={processingId === user.id}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {processingId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
