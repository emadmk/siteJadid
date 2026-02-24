'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Save, X, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  accountType: string;
  gsaApprovalStatus: string | null;
  gsaNumber: string | null;
  gsaDepartment: string | null;
}

interface UserManagementProps {
  user: User;
  currentUserRole: string;
}

const ROLES = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service' },
  { value: 'ACCOUNTANT', label: 'Accounting' },
  { value: 'MARKETING_MANAGER', label: 'Marketing' },
  { value: 'CONTENT_MANAGER', label: 'Content Manager' },
  { value: 'WAREHOUSE_MANAGER', label: 'Warehouse' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];
const ACCOUNT_TYPES = [
  { value: 'B2C', label: 'Personal (B2C)' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'B2B', label: 'Business (B2B)' },
  { value: 'VOLUME_BUYER', label: 'Volume Buyer' },
  { value: 'GSA', label: 'Government' },
  { value: 'GOVERNMENT', label: 'Government' },
];
const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
const GOVERNMENT_DEPARTMENTS = ['DOD', 'DLA', 'USDA', 'NIH', 'GSA', 'VA', 'State', 'Local'];

export function UserManagement({ user, currentUserRole }: UserManagementProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    accountType: user.accountType,
    gsaApprovalStatus: user.gsaApprovalStatus || '',
    gsaNumber: user.gsaNumber || '',
    gsaDepartment: user.gsaDepartment || '',
  });

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';
  const canEditRole = isSuperAdmin;
  const canDelete = isSuperAdmin;

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          role: formData.role,
          accountType: formData.accountType,
          gsaApprovalStatus: ['GSA', 'GOVERNMENT', 'B2B', 'VOLUME_BUYER'].includes(formData.accountType) ? formData.gsaApprovalStatus || null : null,
          gsaNumber: ['GSA', 'GOVERNMENT'].includes(formData.accountType) ? formData.gsaNumber || null : null,
          gsaDepartment: ['GSA', 'GOVERNMENT'].includes(formData.accountType) ? formData.gsaDepartment || null : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      router.push('/admin/customers');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      accountType: user.accountType,
      gsaApprovalStatus: user.gsaApprovalStatus || '',
      gsaNumber: user.gsaNumber || '',
      gsaDepartment: user.gsaDepartment || '',
    });
    setIsEditing(false);
    setError(null);
  };

  if (isDeleting) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Delete User</h3>
            <p className="text-sm text-red-600">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-gray-700 mb-4">
          Are you sure you want to delete <strong>{user.name || user.email}</strong>?
          All associated data (orders history, addresses, reviews) will be preserved but the user account will be removed.
        </p>
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Deleting...' : 'Yes, Delete User'}
          </Button>
          <Button
            onClick={() => setIsDeleting(false)}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-black">Edit User</h3>
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            className="border-gray-300"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>

          {/* Role - Only Super Admin can change */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role {!canEditRole && <span className="text-xs text-gray-500">(Super Admin only)</span>}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={!canEditRole}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 disabled:bg-gray-100"
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Government Fields - Only shown for Government accounts */}
          {(formData.accountType === 'GOVERNMENT' || formData.accountType === 'GSA') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Government Department</label>
                <select
                  value={formData.gsaDepartment}
                  onChange={(e) => setFormData({ ...formData, gsaDepartment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                >
                  <option value="">Select Department</option>
                  {GOVERNMENT_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Government ID Number</label>
                <input
                  type="text"
                  value={formData.gsaNumber}
                  onChange={(e) => setFormData({ ...formData, gsaNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
                <select
                  value={formData.gsaApprovalStatus}
                  onChange={(e) => setFormData({ ...formData, gsaApprovalStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                >
                  <option value="">Select Status</option>
                  {APPROVAL_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Volume Buyer Fields - Only shown for Volume Buyer accounts */}
          {(formData.accountType === 'VOLUME_BUYER' || formData.accountType === 'B2B') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
              <select
                value={formData.gsaApprovalStatus}
                onChange={(e) => setFormData({ ...formData, gsaApprovalStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              >
                <option value="">Select Status</option>
                {APPROVAL_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-safety-green-600 hover:bg-safety-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={loading}
            className="border-gray-300"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-black mb-4">User Actions</h3>
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => setIsEditing(true)}
          variant="outline"
          className="w-full justify-start border-gray-300 hover:border-safety-green-600 hover:text-safety-green-600"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit User
        </Button>
        {canDelete && (
          <Button
            onClick={() => setIsDeleting(true)}
            variant="outline"
            className="w-full justify-start border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete User
          </Button>
        )}
        {!canDelete && (
          <p className="text-xs text-gray-500 mt-2">
            Only Super Admin can delete users
          </p>
        )}
      </div>
    </div>
  );
}
