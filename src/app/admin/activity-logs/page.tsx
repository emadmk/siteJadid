'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Search, Filter, Calendar, User, Shield, Package, ShoppingCart,
  Settings, ChevronLeft, ChevronRight, RefreshCw, Clock, ArrowUpDown,
  Eye, Edit, Trash2, LogIn, LogOut, Download, Upload, X, FileText,
  Users, Warehouse, CreditCard, Tag, Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LogEntry {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  metadata: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

interface Stats {
  total: number;
  today: number;
  thisWeek: number;
  entities: string[];
  users: { id: string; name: string | null; email: string }[];
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  CREATE: { icon: Edit, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Created' },
  UPDATE: { icon: Edit, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Updated' },
  DELETE: { icon: Trash2, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Deleted' },
  READ: { icon: Eye, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Viewed' },
  LOGIN: { icon: LogIn, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'Login' },
  LOGOUT: { icon: LogOut, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'Logout' },
  EXPORT: { icon: Download, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200', label: 'Exported' },
  IMPORT: { icon: Upload, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', label: 'Imported' },
};

const ENTITY_ICONS: Record<string, any> = {
  Product: Package,
  Order: ShoppingCart,
  User: Users,
  Customer: Users,
  Settings: Settings,
  Warehouse: Warehouse,
  Payment: CreditCard,
  Brand: Tag,
  Category: Tag,
  Notification: Bell,
  Invoice: FileText,
};

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Expanded log detail
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async (p?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (p || page).toString(),
        limit: '50',
      });
      if (search) params.set('search', search);
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entity', entityFilter);
      if (userFilter) params.set('userId', userFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const res = await fetch(`/api/admin/activity-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, entityFilter, userFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    fetchLogs(1);
  };

  const clearFilters = () => {
    setSearch('');
    setActionFilter('');
    setEntityFilter('');
    setUserFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    setTimeout(() => fetchLogs(1), 0);
  };

  const hasFilters = search || actionFilter || entityFilter || userFilter || dateFrom || dateTo;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-safety-green-600" />
            Activity Logs
          </h1>
          <p className="text-gray-600">Track all admin actions and system events</p>
        </div>
        <Button onClick={() => fetchLogs()} variant="outline" className="border-gray-300 gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-safety-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-safety-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-black">{stats?.total?.toLocaleString() || 0}</div>
              <div className="text-xs text-gray-500">Total Events</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-black">{stats?.today?.toLocaleString() || 0}</div>
              <div className="text-xs text-gray-500">Today</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-black">{stats?.thisWeek?.toLocaleString() || 0}</div>
              <div className="text-xs text-gray-500">This Week</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-black">{stats?.users?.length || 0}</div>
              <div className="text-xs text-gray-500">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Search by description, entity ID, IP, user..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500 text-sm"
            />
          </div>
          <Button onClick={applyFilters} className="bg-safety-green-600 hover:bg-safety-green-700 gap-2">
            <Search className="w-4 h-4" />
            Search
          </Button>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className={`border-gray-300 gap-2 ${showFilters ? 'bg-gray-100' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasFilters && <span className="w-2 h-2 bg-safety-green-500 rounded-full" />}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-safety-green-500"
              >
                <option value="">All Actions</option>
                {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Entity</label>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-safety-green-500"
              >
                <option value="">All Entities</option>
                {(stats?.entities || []).map((entity) => (
                  <option key={entity} value={entity}>{entity}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">User</label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-safety-green-500"
              >
                <option value="">All Users</option>
                {(stats?.users || []).map((u) => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
            <div className="md:col-span-5 flex gap-2">
              <Button onClick={applyFilters} size="sm" className="bg-safety-green-600 hover:bg-safety-green-700">
                Apply Filters
              </Button>
              {hasFilters && (
                <Button onClick={clearFilters} size="sm" variant="outline" className="border-gray-300 gap-1">
                  <X className="w-3 h-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-8 h-8 text-safety-green-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <Activity className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {hasFilters ? 'No Matching Logs' : 'No Activity Logs Yet'}
            </h3>
            <p className="text-gray-500 text-sm">
              {hasFilters
                ? 'Try adjusting your filters.'
                : 'Activity logs will appear here as admin actions are performed.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Entity</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => {
                    const actionCfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.READ;
                    const ActionIcon = actionCfg.icon;
                    const EntityIcon = ENTITY_ICONS[log.entity] || FileText;
                    const isExpanded = expandedId === log.id;
                    let metadata: any = null;
                    try { if (log.metadata) metadata = JSON.parse(log.metadata); } catch {}

                    return (
                      <>
                        <tr
                          key={log.id}
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div className="text-sm text-gray-900">{formatTimeAgo(log.createdAt)}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(log.createdAt).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-safety-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-3.5 h-3.5 text-safety-green-600" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{log.user?.name || 'System'}</div>
                                <div className="text-xs text-gray-400 truncate">{log.user?.role?.replace('_', ' ')}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${actionCfg.bg} ${actionCfg.color}`}>
                              <ActionIcon className="w-3 h-3" />
                              {actionCfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <EntityIcon className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm text-gray-900">{log.entity}</div>
                                {log.entityId && (
                                  <div className="text-xs text-gray-400 font-mono">{log.entityId.substring(0, 12)}...</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-sm text-gray-700 max-w-xs truncate">{log.description}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-xs text-gray-400 font-mono">{log.ipAddress || '-'}</div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${log.id}-detail`}>
                            <td colSpan={6} className="px-5 py-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 mb-1">Full Description</div>
                                  <div className="text-gray-700">{log.description}</div>
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 mb-1">Details</div>
                                  <div className="space-y-1 text-gray-600 text-xs">
                                    <div>User: {log.user?.email || 'N/A'}</div>
                                    <div>Entity ID: <span className="font-mono">{log.entityId || 'N/A'}</span></div>
                                    <div>IP: {log.ipAddress || 'N/A'}</div>
                                    <div>Time: {new Date(log.createdAt).toLocaleString()}</div>
                                  </div>
                                </div>
                                {metadata && (
                                  <div>
                                    <div className="text-xs font-semibold text-gray-500 mb-1">Metadata</div>
                                    <pre className="text-xs text-gray-600 bg-white border border-gray-200 rounded p-2 overflow-x-auto max-h-32">
                                      {JSON.stringify(metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing {((page - 1) * 50) + 1} - {Math.min(page * 50, total)} of {total.toLocaleString()} logs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-gray-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 px-3">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-gray-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
