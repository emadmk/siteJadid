'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Truck,
  Package,
  Layers,
  Loader2,
  Info,
  CheckCircle2,
  AlertTriangle,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Mode = 'FREE' | 'FIXED' | 'PERCENT' | 'SHIPPO';

interface ShippingRule {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  isActive: boolean;
  supplierIds: string[];
  warehouseIds: string[];
  mode: Mode;
  flatAmount: string | number | null;
  percentValue: string | number | null;
  shippoMarkupType: string | null;
  shippoMarkupValue: string | number | null;
}

interface HandlingTier {
  id: string;
  minSubtotal: string | number;
  maxSubtotal: string | number | null;
  type: 'fixed' | 'percent';
  value: string | number;
  isActive: boolean;
  displayOrder: number;
}

interface Supplier { id: string; name: string; code?: string }
interface Warehouse { id: string; name: string; code?: string }

const DEFAULT_NEW_RULE: Partial<ShippingRule> = {
  name: '',
  description: '',
  priority: 0,
  isActive: true,
  supplierIds: [],
  warehouseIds: [],
  mode: 'SHIPPO',
  flatAmount: 0,
  percentValue: 0,
  shippoMarkupType: null,
  shippoMarkupValue: 0,
};

const DEFAULT_NEW_TIER: Partial<HandlingTier> = {
  minSubtotal: 0,
  maxSubtotal: 100,
  type: 'fixed',
  value: 0,
  isActive: true,
  displayOrder: 0,
};

export default function ShippingSettingsPage() {
  const [tab, setTab] = useState<'rules' | 'tiers' | 'shippo'>('rules');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [editingRule, setEditingRule] = useState<Partial<ShippingRule> | null>(null);
  const [savingRule, setSavingRule] = useState(false);
  const [loadingRules, setLoadingRules] = useState(true);

  const [tiers, setTiers] = useState<HandlingTier[]>([]);
  const [editingTier, setEditingTier] = useState<Partial<HandlingTier> | null>(null);
  const [savingTier, setSavingTier] = useState(false);
  const [loadingTiers, setLoadingTiers] = useState(true);
  const [skipForGovernment, setSkipForGovernment] = useState(false);

  const [shippoSettings, setShippoSettings] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadAll = useCallback(async () => {
    setLoadingRules(true);
    setLoadingTiers(true);
    const [rulesRes, tiersRes, supRes, whRes, settingsRes] = await Promise.all([
      fetch('/api/admin/shipping-rules').then((r) => r.json()),
      fetch('/api/admin/handling-tiers').then((r) => r.json()),
      fetch('/api/admin/suppliers?limit=500').then((r) => r.json()).catch(() => ({ suppliers: [] })),
      fetch('/api/admin/warehouses?limit=500').then((r) => r.json()).catch(() => ({ warehouses: [] })),
      fetch('/api/admin/settings?category=shipping').then((r) => r.json()).catch(() => ({})),
    ]);
    setRules(rulesRes.rules || []);
    setTiers(tiersRes.tiers || []);
    setSkipForGovernment(!!tiersRes.skipForGovernment);
    setSuppliers(supRes.suppliers || supRes.data || []);
    setWarehouses(whRes.warehouses || whRes.data || []);
    setShippoSettings(settingsRes.settings || settingsRes);
    setLoadingRules(false);
    setLoadingTiers(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const saveRule = async () => {
    if (!editingRule) return;
    if (!editingRule.name?.trim()) { showToast('error', 'Name is required'); return; }
    setSavingRule(true);
    try {
      const isNew = !editingRule.id;
      const url = isNew ? '/api/admin/shipping-rules' : `/api/admin/shipping-rules/${editingRule.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingRule) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to save'); }
      showToast('success', isNew ? 'Rule created' : 'Rule updated');
      setEditingRule(null);
      await loadAll();
    } catch (e: any) {
      showToast('error', e.message);
    } finally { setSavingRule(false); }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this rule? Existing orders are unaffected.')) return;
    const res = await fetch(`/api/admin/shipping-rules/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('success', 'Rule deleted'); await loadAll(); }
    else showToast('error', 'Delete failed');
  };

  const saveTier = async () => {
    if (!editingTier) return;
    setSavingTier(true);
    try {
      const isNew = !editingTier.id;
      const url = isNew ? '/api/admin/handling-tiers' : `/api/admin/handling-tiers/${editingTier.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingTier) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to save'); }
      showToast('success', isNew ? 'Tier created' : 'Tier updated');
      setEditingTier(null);
      await loadAll();
    } catch (e: any) {
      showToast('error', e.message);
    } finally { setSavingTier(false); }
  };

  const deleteTier = async (id: string) => {
    if (!confirm('Delete this tier?')) return;
    const res = await fetch(`/api/admin/handling-tiers/${id}`, { method: 'DELETE' });
    if (res.ok) { showToast('success', 'Tier deleted'); await loadAll(); }
    else showToast('error', 'Delete failed');
  };

  const toggleSkipForGovernment = async (val: boolean) => {
    setSkipForGovernment(val);
    await fetch('/api/admin/handling-tiers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skipForGovernment: val }) });
  };

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name || id.slice(0, 8);
  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name || id.slice(0, 8);
  const isDefault = (r: ShippingRule) => r.supplierIds.length === 0 && r.warehouseIds.length === 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/settings">
          <Button variant="outline" size="sm" className="border-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Settings
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-black mb-1 flex items-center gap-2">
            <Truck className="w-7 h-7 text-safety-green-600" /> Shipping &amp; Handling
          </h1>
          <p className="text-gray-600">Per-supplier shipping rules, handling fee tiers, and Shippo integration.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-2 inline-flex gap-1 mb-6">
        <TabButton active={tab === 'rules'} onClick={() => setTab('rules')} icon={<Layers className="w-4 h-4" />}>
          Shipping Rules <span className="ml-1 text-xs opacity-70">({rules.length})</span>
        </TabButton>
        <TabButton active={tab === 'tiers'} onClick={() => setTab('tiers')} icon={<Package className="w-4 h-4" />}>
          Handling Tiers <span className="ml-1 text-xs opacity-70">({tiers.length})</span>
        </TabButton>
        <TabButton active={tab === 'shippo'} onClick={() => setTab('shippo')} icon={<SettingsIcon className="w-4 h-4" />}>
          Shippo Connection
        </TabButton>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${toast.type === 'success' ? 'bg-safety-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />} {toast.message}
        </div>
      )}

      {tab === 'rules' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-gray-600 max-w-2xl">
                Each cart group is split by supplier (then warehouse) and matched to the highest-priority active rule whose scope includes it.
                A rule with no supplier and no warehouse acts as the <strong>default</strong> for everything else.
              </div>
            </div>
            <Button onClick={() => setEditingRule({ ...DEFAULT_NEW_RULE })}>
              <Plus className="w-4 h-4 mr-1" /> New Rule
            </Button>
          </div>

          {loadingRules ? (
            <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : rules.length === 0 ? (
            <div className="py-16 text-center text-gray-500">No rules yet. Create one to get started.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Scope</th>
                  <th className="text-left px-4 py-3">Mode</th>
                  <th className="text-right px-4 py-3">Priority</th>
                  <th className="text-center px-4 py-3">Active</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-black">{r.name}</div>
                      {r.description && <div className="text-xs text-gray-500">{r.description}</div>}
                      {isDefault(r) && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 mt-1 inline-block">Default rule</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {r.supplierIds.map((id) => (<span key={id} className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded">{supplierName(id)}</span>))}
                        {r.warehouseIds.map((id) => (<span key={id} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded">{warehouseName(id)}</span>))}
                        {isDefault(r) && <span className="text-xs text-gray-400">(matches everything else)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><ModeChip mode={r.mode} rule={r} /></td>
                    <td className="px-4 py-3 text-right text-sm">{r.priority}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${r.isActive ? 'bg-safety-green-500' : 'bg-gray-300'}`} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setEditingRule({ ...r })} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteRule(r.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded ml-1"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'tiers' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-gray-600 max-w-2xl">
                  Handling fee added to every cart based on its subtotal. Tiers must not overlap — the first matching tier wins. Fee is added invisibly into the displayed
                  &ldquo;Shipping + Handling Fee&rdquo; line.
                </div>
              </div>
              <Button onClick={() => setEditingTier({ ...DEFAULT_NEW_TIER, displayOrder: tiers.length })}>
                <Plus className="w-4 h-4 mr-1" /> New Tier
              </Button>
            </div>

            {loadingTiers ? (
              <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : tiers.length === 0 ? (
              <div className="py-16 text-center text-gray-500">No handling tiers configured.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">Subtotal Range</th>
                    <th className="text-left px-4 py-3">Fee</th>
                    <th className="text-center px-4 py-3">Active</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((t) => (
                    <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        ${Number(t.minSubtotal).toFixed(2)} – {t.maxSubtotal == null ? '∞' : `$${Number(t.maxSubtotal).toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{t.type === 'percent' ? `${Number(t.value)}%` : `$${Number(t.value).toFixed(2)}`}</span>
                        <span className="text-xs text-gray-500 ml-2">{t.type}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${t.isActive ? 'bg-safety-green-500' : 'bg-gray-300'}`} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => setEditingTier({ ...t })} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteTier(t.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded ml-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-black">Skip handling fee for Government / B2B orders</div>
              <div className="text-sm text-gray-500">When enabled, GSA / volume buyer orders pay only the per-supplier shipping (no handling fee added).</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={skipForGovernment} onChange={(e) => toggleSkipForGovernment(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-safety-green-600 rounded-full transition-all relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-5 after:h-5 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>
        </div>
      )}

      {tab === 'shippo' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-gray-600 max-w-2xl">
              Shippo connection details are managed in the main <Link className="text-blue-600 underline" href="/admin/settings">Settings page</Link>. The legacy global markup
              (<code>shipping.markupFixedAmount</code> / <code>shipping.markupPercentage</code>) is now a per-rule setting under <strong>Shipping Rules → SHIPPO mode</strong>.
              Old values are preserved for backwards compatibility but new orders use the rule-based markup.
            </div>
          </div>
          {shippoSettings && (
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <KV label="Shippo API Key" value={shippoSettings.shippoApiKey ? `••••${String(shippoSettings.shippoApiKey).slice(-4)}` : '(not set)'} />
              <KV label="Test Mode" value={shippoSettings.shippoTestMode ? 'Yes' : 'No'} />
              <KV label="Origin City" value={shippoSettings.originCity || '—'} />
              <KV label="Origin Zip" value={shippoSettings.originZip || '—'} />
              <KV label="Legacy markup (fixed $)" value={shippoSettings.markupFixedAmount || '0'} dim />
              <KV label="Legacy markup (%)" value={shippoSettings.markupPercentage || '0'} dim />
            </div>
          )}
        </div>
      )}

      {editingRule && (
        <RuleEditor rule={editingRule} suppliers={suppliers} warehouses={warehouses} saving={savingRule} onChange={setEditingRule} onCancel={() => setEditingRule(null)} onSave={saveRule} />
      )}
      {editingTier && (
        <TierEditor tier={editingTier} saving={savingTier} onChange={setEditingTier} onCancel={() => setEditingTier(null)} onSave={saveTier} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-safety-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
      {icon} {children}
    </button>
  );
}

function ModeChip({ mode, rule }: { mode: Mode; rule: ShippingRule }) {
  if (mode === 'FREE') return <span className="px-2 py-1 text-xs rounded-full bg-safety-green-100 text-safety-green-800 font-medium">Free</span>;
  if (mode === 'FIXED') return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">${Number(rule.flatAmount || 0).toFixed(2)} fixed</span>;
  if (mode === 'PERCENT') return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium">{Number(rule.percentValue || 0)}% of subtotal</span>;
  if (mode === 'SHIPPO') {
    const m = rule.shippoMarkupType;
    const v = rule.shippoMarkupValue;
    const suffix = m && v ? ` + ${m === 'percent' ? `${v}%` : `$${v}`}` : '';
    return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 font-medium">Shippo rate{suffix}</span>;
  }
  return null;
}

function KV({ label, value, dim }: { label: string; value: string | number; dim?: boolean }) {
  return (
    <div>
      <div className={`text-xs uppercase ${dim ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
      <div className={`font-medium ${dim ? 'text-gray-500' : 'text-black'}`}>{String(value)}</div>
    </div>
  );
}

function RuleEditor({ rule, suppliers, warehouses, saving, onChange, onCancel, onSave }: any) {
  const set = (patch: Partial<ShippingRule>) => onChange({ ...rule, ...patch });
  return (
    <Modal title={rule.id ? 'Edit Shipping Rule' : 'New Shipping Rule'} onClose={onCancel}>
      <div className="space-y-4">
        <Field label="Name *">
          <input className="ship-input" value={rule.name || ''} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Grainger Free Shipping" />
        </Field>
        <Field label="Description">
          <input className="ship-input" value={rule.description || ''} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Suppliers in scope">
            <MultiSelect items={suppliers} selected={rule.supplierIds || []} onChange={(ids) => set({ supplierIds: ids })} placeholder="Add supplier…" />
          </Field>
          <Field label="Warehouses in scope">
            <MultiSelect items={warehouses} selected={rule.warehouseIds || []} onChange={(ids) => set({ warehouseIds: ids })} placeholder="Add warehouse…" />
          </Field>
        </div>
        {(rule.supplierIds || []).length === 0 && (rule.warehouseIds || []).length === 0 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 text-sm rounded-lg px-3 py-2">
            Empty scope = <strong>default rule</strong>. Applies to any cart group not matched by a more specific rule.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority"><input type="number" className="ship-input" value={rule.priority ?? 0} onChange={(e) => set({ priority: parseInt(e.target.value, 10) || 0 })} /></Field>
          <Field label="Active">
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={rule.isActive !== false} onChange={(e) => set({ isActive: e.target.checked })} />
              <span className="text-sm">Rule is active</span>
            </label>
          </Field>
        </div>
        <Field label="Mode">
          <div className="grid grid-cols-4 gap-2">
            {(['FREE', 'FIXED', 'PERCENT', 'SHIPPO'] as Mode[]).map((m) => (
              <button key={m} type="button" onClick={() => set({ mode: m })}
                className={`py-2 px-3 rounded-lg border text-sm font-medium ${rule.mode === m ? 'border-safety-green-600 bg-safety-green-50 text-safety-green-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {m === 'FREE' ? 'Free' : m === 'FIXED' ? 'Fixed $' : m === 'PERCENT' ? '% of subtotal' : 'Shippo rate'}
              </button>
            ))}
          </div>
        </Field>
        {rule.mode === 'FIXED' && (
          <Field label="Fixed amount ($)"><input type="number" step="0.01" className="ship-input" value={rule.flatAmount ?? 0} onChange={(e) => set({ flatAmount: e.target.value })} /></Field>
        )}
        {rule.mode === 'PERCENT' && (
          <Field label="Percent of group subtotal (%)"><input type="number" step="0.01" className="ship-input" value={rule.percentValue ?? 0} onChange={(e) => set({ percentValue: e.target.value })} /></Field>
        )}
        {rule.mode === 'SHIPPO' && (
          <Field label="Shippo rate markup">
            <div className="flex gap-2">
              <select className="ship-input" value={rule.shippoMarkupType || ''} onChange={(e) => set({ shippoMarkupType: e.target.value || null })}>
                <option value="">No markup</option>
                <option value="fixed">Fixed $</option>
                <option value="percent">Percent %</option>
              </select>
              {rule.shippoMarkupType && (
                <input type="number" step="0.01" className="ship-input flex-1" value={rule.shippoMarkupValue ?? 0} onChange={(e) => set({ shippoMarkupValue: e.target.value })}
                  placeholder={rule.shippoMarkupType === 'percent' ? 'e.g. 5' : 'e.g. 2.50'} />
              )}
            </div>
          </Field>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-1" /> Cancel</Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save Rule
        </Button>
      </div>
    </Modal>
  );
}

function TierEditor({ tier, saving, onChange, onCancel, onSave }: any) {
  const set = (patch: Partial<HandlingTier>) => onChange({ ...tier, ...patch });
  return (
    <Modal title={tier.id ? 'Edit Handling Tier' : 'New Handling Tier'} onClose={onCancel}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min subtotal ($) *"><input type="number" step="0.01" className="ship-input" value={tier.minSubtotal ?? 0} onChange={(e) => set({ minSubtotal: e.target.value })} /></Field>
          <Field label="Max subtotal ($)">
            <input type="number" step="0.01" className="ship-input" value={tier.maxSubtotal ?? ''} placeholder="leave blank for ∞" onChange={(e) => set({ maxSubtotal: e.target.value || null })} />
          </Field>
        </div>
        <Field label="Type">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => set({ type: 'fixed' })} className={`py-2 rounded-lg border text-sm font-medium ${tier.type === 'fixed' ? 'border-safety-green-600 bg-safety-green-50' : 'border-gray-200'}`}>Fixed $</button>
            <button type="button" onClick={() => set({ type: 'percent' })} className={`py-2 rounded-lg border text-sm font-medium ${tier.type === 'percent' ? 'border-safety-green-600 bg-safety-green-50' : 'border-gray-200'}`}>Percent %</button>
          </div>
        </Field>
        <Field label={tier.type === 'percent' ? 'Value (%)' : 'Value ($)'}>
          <input type="number" step="0.01" className="ship-input" value={tier.value ?? 0} onChange={(e) => set({ value: e.target.value })} />
        </Field>
        <Field label="">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={tier.isActive !== false} onChange={(e) => set({ isActive: e.target.checked })} />
            <span className="text-sm">Tier is active</span>
          </label>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-1" /> Cancel</Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save Tier
        </Button>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-black">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
        <style jsx global>{`
          .ship-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.15s;
            background: white;
          }
          .ship-input:focus {
            border-color: #16a34a;
            box-shadow: 0 0 0 3px rgba(22,163,74,0.1);
          }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {children}
    </div>
  );
}

function MultiSelect({ items, selected, onChange, placeholder }: { items: { id: string; name: string }[]; selected: string[]; onChange: (ids: string[]) => void; placeholder: string }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = items.filter((i) => !selected.includes(i.id) && (i.name || '').toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 p-2 border border-gray-200 rounded-lg min-h-[42px] bg-white">
        {selected.map((id) => {
          const item = items.find((i) => i.id === id);
          return (
            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
              {item?.name || id.slice(0, 8)}
              <button onClick={() => onChange(selected.filter((x) => x !== id))}><X className="w-3 h-3" /></button>
            </span>
          );
        })}
        <input
          className="flex-1 min-w-[80px] outline-none text-sm bg-transparent"
          placeholder={placeholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.slice(0, 30).map((i) => (
            <button key={i.id} type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange([...selected, i.id]); setSearch(''); }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100">
              {i.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
