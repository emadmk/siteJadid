'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

export default function SetupAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [secretKey, setSecretKey] = useState('');

  const listUsers = async () => {
    if (!secretKey.trim()) {
      setError('Please enter the secret key');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/make-admin?secretKey=${encodeURIComponent(secretKey)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to list users');
        setUsers([]);
      } else {
        setUsers(data.users || []);
        setMessage(`Found ${data.users?.length || 0} user(s)`);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (email: string, role: string = 'SUPER_ADMIN') => {
    if (!secretKey.trim()) {
      setError('Please enter the secret key');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
          secretKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update user');
      } else {
        setMessage(data.message || 'User updated successfully!');
        // Refresh the list
        await listUsers();
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-safety-green-100 rounded-lg">
              <ShieldCheck className="w-8 h-8 text-safety-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">Admin Setup</h1>
              <p className="text-gray-600">Configure admin access for your users</p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> This is a temporary setup page. After setting up your admin user,
              this page should be removed or protected in production.
            </p>
          </div>

          {/* Secret Key Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret Key
            </label>
            <p className="text-xs text-gray-600 mb-2">
              Set in .env as ADMIN_SETUP_KEY (default: "change-me-in-production")
            </p>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter secret key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            />
          </div>

          {/* List Users Button */}
          <div className="mb-6">
            <Button
              onClick={listUsers}
              disabled={loading}
              className="bg-safety-green-600 hover:bg-safety-green-700 text-white"
            >
              {loading ? 'Loading...' : 'List Users'}
            </Button>
          </div>

          {/* Messages */}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Users List */}
          {users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Current Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Account Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-black">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.name || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{user.accountType}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => makeAdmin(user.email, 'SUPER_ADMIN')}
                            disabled={loading || user.role === 'SUPER_ADMIN'}
                            className="bg-safety-green-600 hover:bg-safety-green-700 text-white text-xs"
                          >
                            Make Super Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => makeAdmin(user.email, 'ADMIN')}
                            disabled={loading || user.role === 'ADMIN'}
                            className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs"
                          >
                            Make Admin
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-black mb-2">Instructions:</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Enter the secret key (set in .env as ADMIN_SETUP_KEY)</li>
              <li>Click "List Users" to see all users</li>
              <li>Click "Make Super Admin" or "Make Admin" for the desired user</li>
              <li>After setup, remove this page or add authentication protection</li>
              <li>Access admin panel at: <code className="bg-gray-200 px-1 rounded">/admin</code></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
