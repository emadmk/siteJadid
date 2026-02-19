'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  UserPlus,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  Eye,
  EyeOff,
  Calculator,
  Headphones,
  Megaphone,
  FileEdit,
  Warehouse,
  Crown,
  UserCog,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Staff role definitions
const STAFF_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', icon: Crown, color: 'bg-red-100 text-red-800 border-red-200', description: 'Full access to everything' },
  { value: 'ADMIN', label: 'Admin', icon: ShieldCheck, color: 'bg-orange-100 text-orange-800 border-orange-200', description: 'Full access except system settings' },
  { value: 'ACCOUNTANT', label: 'Accounting', icon: Calculator, color: 'bg-emerald-100 text-emerald-800 border-emerald-200', description: 'Financial reports, invoices, payments' },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service', icon: Headphones, color: 'bg-blue-100 text-blue-800 border-blue-200', description: 'Orders, customers, support' },
  { value: 'MARKETING_MANAGER', label: 'Marketing', icon: Megaphone, color: 'bg-purple-100 text-purple-800 border-purple-200', description: 'Discounts, coupons, banners, emails' },
  { value: 'CONTENT_MANAGER', label: 'Content Manager', icon: FileEdit, color: 'bg-pink-100 text-pink-800 border-pink-200', description: 'Products, content, marketing' },
  { value: 'WAREHOUSE_MANAGER', label: 'Warehouse', icon: Warehouse, color: 'bg-amber-100 text-amber-800 border-amber-200', description: 'Inventory, suppliers, shipping' },
] as const;

function getRoleConfig(role: string) {
  return STAFF_ROLES.find(r => r.value === role) || { value: role, label: role, icon: Users, color: 'bg-gray-100 text-gray-800 border-gray-200', description: '' };
}

interface StaffUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
  emailVerified: Date | null;
}

interface Stats {
  total: number;
  byRole: Record<string, number>;
}

export default function TeamManagementPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, byRole: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // New user form
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'ADMIN' as string,
  });
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setUsers(data.users);
      setStats(data.stats);
    } catch {
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setSuccess(`${data.name} added as ${getRoleConfig(data.role).label}`);
      setNewUser({ name: '', email: '', password: '', phone: '', role: 'ADMIN' });
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole, isActive: editActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setSuccess('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (user: StaffUser) => {
    setEditingUser(user.id);
    setEditRole(user.role);
    setEditActive(user.isActive);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Team Management</h1>
          <p className="text-gray-600">Manage staff accounts and role-based access</p>
        </div>
        {isSuperAdmin && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-safety-green-600 hover:bg-safety-green-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-800">{success}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-black">{stats.total}</div>
          <div className="text-xs text-gray-600">Total Staff</div>
        </div>
        {STAFF_ROLES.map(role => (
          <div key={role.value} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <role.icon className="w-4 h-4 text-gray-500" />
              <span className="text-2xl font-bold text-black">{stats.byRole[role.value] || 0}</span>
            </div>
            <div className="text-xs text-gray-600 truncate">{role.label}</div>
          </div>
        ))}
      </div>

      {/* Add New Team Member Form */}
      {showAddForm && isSuperAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-black mb-4">Add New Team Member</h2>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@adasupply.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {STAFF_ROLES.filter(r => r.value !== 'SUPER_ADMIN').map(role => (
                  <button
                    type="button"
                    key={role.value}
                    onClick={() => setNewUser({ ...newUser, role: role.value })}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      newUser.role === role.value
                        ? 'border-safety-green-500 bg-safety-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <role.icon className="w-4 h-4" />
                      <span className="font-medium text-sm text-black">{role.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving} className="bg-safety-green-600 hover:bg-safety-green-700">
                {saving ? 'Creating...' : 'Create Account'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="border-gray-300">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Role Permission Reference */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-black mb-4">Role Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STAFF_ROLES.map(role => (
            <div key={role.value} className={`rounded-lg border p-3 ${role.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <role.icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{role.label}</span>
              </div>
              <p className="text-xs opacity-80">{role.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Roles</option>
              {STAFF_ROLES.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-safety-green-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Loading team members...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No team members found</h3>
              <p className="text-gray-600">
                {search || roleFilter ? 'Try adjusting your filters' : 'Add your first team member'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Joined</th>
                  {isSuperAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => {
                  const roleConfig = getRoleConfig(user.role);
                  const RoleIcon = roleConfig.icon;
                  const isCurrentUser = user.id === session?.user?.id;
                  const isEditing = editingUser === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.isActive ? 'bg-safety-green-100' : 'bg-gray-200'
                          }`}>
                            <RoleIcon className={`w-5 h-5 ${
                              user.isActive ? 'text-safety-green-600' : 'text-gray-400'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-black">
                              {user.name || 'No Name'}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs bg-safety-green-100 text-safety-green-700 px-2 py-0.5 rounded-full">You</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-700">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-700">{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-safety-green-500"
                          >
                            {STAFF_ROLES.map(role => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${roleConfig.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            {roleConfig.label}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={() => setEditActive(!editActive)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer ${
                              editActive
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                            }`}
                          >
                            {editActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {editActive ? 'Active' : 'Disabled'}
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            user.isActive
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {user.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {user.isActive ? 'Active' : 'Disabled'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        {user.lastLogin && (
                          <div className="text-xs text-gray-500">
                            Last login: {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateUser(user.id)}
                                disabled={saving}
                                className="bg-safety-green-600 hover:bg-safety-green-700"
                              >
                                <Save className="w-3.5 h-3.5 mr-1" />
                                {saving ? '...' : 'Save'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUser(null)}
                                className="border-gray-300"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(user)}
                              disabled={isCurrentUser}
                              className="border-gray-300 hover:border-safety-green-600 hover:text-safety-green-600 disabled:opacity-50"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
