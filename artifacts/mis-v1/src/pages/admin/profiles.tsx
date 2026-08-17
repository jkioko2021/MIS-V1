import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Shield, Plus, Save, Trash2, RefreshCw, Users,
  ChevronRight, AlertCircle, Check, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const API = '/api';

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, { credentials: 'include', ...init });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  profile_id: number;
  profile_name: string;
  profile_type: string;
  is_active: boolean;
  employee_count: number;
}

interface AccessItem {
  main_menu_name: string;
  sub_menu_name: string;
  page_url: string;
  menu_order: number;
  can_access: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  read_only: boolean;
}

const PERM_COLS: Array<{ key: keyof AccessItem; label: string; short: string }> = [
  { key: 'can_access', label: 'Access', short: 'View' },
  { key: 'can_add',    label: 'Add',    short: 'Add'  },
  { key: 'can_edit',   label: 'Edit',   short: 'Edit' },
  { key: 'can_delete', label: 'Delete', short: 'Del'  },
  { key: 'read_only',  label: 'Read Only', short: 'RO' },
];

const PROFILE_TYPES = ['ADMIN', 'OPERATIONS', 'FINANCE', 'RISK', 'REPORTS', 'CUSTOM'];

// ─── New Profile Dialog ───────────────────────────────────────────────────────
function NewProfileDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: number) => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState('ADMIN');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => apiFetch('/admin/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_name: name, profile_type: type }),
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-profiles'] });
      onCreated(data.data.profile_id);
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex gap-2 items-center"><Shield className="w-4 h-4 text-blue-600" />New Profile / Role</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Profile Name <span className="text-red-500">*</span></Label>
            <Input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Claims Assessor" />
          </div>
          <div className="space-y-1.5">
            <Label>Profile Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROFILE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {error && <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!name || mutation.isPending}>
            {mutation.isPending ? <><RefreshCw className="w-3 h-3 mr-2 animate-spin" />Creating…</> : 'Create Profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Access Rights Matrix ─────────────────────────────────────────────────────
function AccessMatrix({ profileId }: { profileId: number }) {
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [items, setItems] = useState<AccessItem[]>([]);
  const [error, setError] = useState('');

  const { isLoading, data } = useQuery({
    queryKey: ['profile-access', profileId],
    queryFn: () => apiFetch(`/admin/profiles/${profileId}/access`),
    select: (d) => d,
  });

  // Sync items from server when data arrives
  const serverItems: AccessItem[] = data?.items ?? [];
  const workingItems = dirty ? items : serverItems;

  const toggle = (idx: number, col: keyof AccessItem) => {
    setDirty(true);
    setSaved(false);
    const base = dirty ? items : [...serverItems];
    const updated = base.map((it, i) => {
      if (i !== idx) return it;
      const newVal = !it[col];
      const patch: Partial<AccessItem> = { [col]: newVal };
      // If enabling a permission, auto-enable access
      if (col !== 'can_access' && newVal) patch.can_access = true;
      // If disabling access, disable all others
      if (col === 'can_access' && !newVal) {
        patch.can_add = false; patch.can_edit = false;
        patch.can_delete = false; patch.read_only = false;
      }
      return { ...it, ...patch };
    });
    setItems(updated);
  };

  const toggleRow = (idx: number, grantAll: boolean) => {
    setDirty(true); setSaved(false);
    const base = dirty ? items : [...serverItems];
    const updated = base.map((it, i) => i !== idx ? it : {
      ...it,
      can_access: grantAll, can_add: grantAll, can_edit: grantAll,
      can_delete: grantAll, read_only: false,
    });
    setItems(updated);
  };

  const toggleGroup = (mainMenu: string, grantAll: boolean) => {
    setDirty(true); setSaved(false);
    const base = dirty ? items : [...serverItems];
    const updated = base.map(it => it.main_menu_name !== mainMenu ? it : {
      ...it,
      can_access: grantAll, can_add: grantAll, can_edit: grantAll,
      can_delete: grantAll, read_only: false,
    });
    setItems(updated);
  };

  const saveMutation = useMutation({
    mutationFn: () => apiFetch(`/admin/profiles/${profileId}/access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: workingItems }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile-access', profileId] });
      setDirty(false); setSaved(true); setError('');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e: Error) => setError(e.message),
  });

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground"><RefreshCw className="w-4 h-4 animate-spin" />Loading access rights…</div>
    </div>
  );

  // Group by main_menu
  const groups = PERM_COLS.map(c => c); // reuse
  const grouped = workingItems.reduce<Record<string, { items: AccessItem[]; indices: number[] }>>((acc, it, i) => {
    if (!acc[it.main_menu_name]) acc[it.main_menu_name] = { items: [], indices: [] };
    acc[it.main_menu_name].items.push(it);
    acc[it.main_menu_name].indices.push(i);
    return acc;
  }, {});

  const mainMenus = Object.keys(grouped);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Matrix header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
        <div>
          <h3 className="font-semibold text-sm">{data?.profile?.profile_name} — Access Rights</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Configure which pages and actions this profile can access</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="flex items-center gap-1.5 text-xs text-green-600"><Check className="w-3.5 h-3.5" />Saved</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending} className="gap-1.5">
            {saveMutation.isPending ? <><RefreshCw className="w-3 h-3 animate-spin" />Saving…</> : <><Save className="w-3.5 h-3.5" />Save Changes</>}
          </Button>
        </div>
      </div>

      {/* Matrix table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-white z-10 shadow-sm">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground w-64">Menu Item</th>
              {PERM_COLS.map(c => (
                <th key={c.key} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground w-20">{c.short}</th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground w-24">Quick</th>
            </tr>
          </thead>
          <tbody>
            {mainMenus.map(menu => {
              const group = grouped[menu];
              const allAccess = group.items.every(it => it.can_access);
              return [
                // Group header row
                <tr key={`grp-${menu}`} className="bg-slate-50 border-y border-slate-100">
                  <td colSpan={6} className="px-5 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{menu}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => group.indices.forEach(i => toggleGroup(menu, true))}
                          className="text-xs text-blue-600 hover:underline">Grant all</button>
                        <span className="text-slate-300">|</span>
                        <button onClick={() => group.indices.forEach(i => toggleGroup(menu, false))}
                          className="text-xs text-slate-500 hover:underline">Revoke all</button>
                      </div>
                    </div>
                  </td>
                  <td />
                </tr>,
                // Item rows
                ...group.indices.map(idx => {
                  const it = workingItems[idx];
                  return (
                    <tr key={it.page_url} className="border-b last:border-0 hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium">{it.sub_menu_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{it.page_url}</div>
                      </td>
                      {PERM_COLS.map(col => (
                        <td key={col.key} className="px-3 py-3 text-center">
                          <button
                            onClick={() => toggle(idx, col.key)}
                            className={cn(
                              'w-7 h-7 rounded-lg border-2 flex items-center justify-center mx-auto transition-all',
                              it[col.key]
                                ? col.key === 'can_delete' ? 'bg-red-100 border-red-400 text-red-700'
                                  : col.key === 'read_only' ? 'bg-slate-100 border-slate-400 text-slate-700'
                                  : 'bg-blue-100 border-blue-500 text-blue-700'
                                : 'bg-white border-slate-200 hover:border-slate-400',
                              !it.can_access && col.key !== 'can_access' ? 'opacity-30 cursor-not-allowed' : '',
                            )}
                            disabled={!it.can_access && col.key !== 'can_access'}
                          >
                            {it[col.key] ? <Check className="w-3.5 h-3.5" /> : null}
                          </button>
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => toggleRow(idx, true)}
                            className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
                            title="Grant all">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={() => toggleRow(idx, false)}
                            className="w-6 h-6 rounded bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300"
                            title="Revoke all">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilesPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: () => apiFetch('/admin/profiles'),
  });
  const profiles: Profile[] = data?.data ?? [];

  const selectedProfile = profiles.find(p => p.profile_id === selectedId);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/profiles/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-profiles'] }); setSelectedId(null); },
    onError: (e: Error) => alert(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => apiFetch(`/admin/profiles/${editProfile!.profile_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_name: editName, profile_type: editProfile!.profile_type, is_active: editProfile!.is_active }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-profiles'] }); setEditProfile(null); },
  });

  return (
    <div className="flex h-full">
      {/* Left sidebar — profile list */}
      <div className="w-72 shrink-0 border-r bg-muted/10 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-blue-600" />Profiles & Roles</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{profiles.length} profiles</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setNewOpen(true)} className="h-8 gap-1.5">
            <Plus className="w-3.5 h-3.5" />New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />Loading…
            </div>
          ) : profiles.map(p => (
            <button
              key={p.profile_id}
              onClick={() => setSelectedId(p.profile_id)}
              className={cn(
                'w-full text-left px-3 py-3 rounded-lg transition-colors group',
                selectedId === p.profile_id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className={cn('w-4 h-4 shrink-0', selectedId === p.profile_id ? 'text-primary-foreground/80' : 'text-blue-500')} />
                  <div>
                    <p className="text-sm font-medium leading-tight">{p.profile_name}</p>
                    <p className={cn('text-xs mt-0.5', selectedId === p.profile_id ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                      {p.profile_type} · <span className="inline-flex items-center gap-0.5"><Users className="w-3 h-3" />{p.employee_count}</span>
                    </p>
                  </div>
                </div>
                <ChevronRight className={cn('w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity', selectedId === p.profile_id ? 'opacity-100 text-primary-foreground/70' : '')} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel */}
      {!selectedId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Select a profile</p>
              <p className="text-sm text-muted-foreground mt-1">Choose a profile on the left to configure its access rights</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setNewOpen(true)} className="gap-2">
              <Plus className="w-3.5 h-3.5" />Create New Profile
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Profile action bar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b bg-white">
            {editProfile?.profile_id === selectedId ? (
              <>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 w-48 text-sm" />
                <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="gap-1.5 h-8">
                  <Check className="w-3 h-3" />Save Name
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditProfile(null)}>Cancel</Button>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-sm">{selectedProfile?.profile_name}</h3>
                <Badge variant="outline" className="text-xs">{selectedProfile?.profile_type}</Badge>
                <Badge variant={selectedProfile?.is_active ? 'outline' : 'secondary'} className={cn('text-xs', selectedProfile?.is_active ? 'text-green-700 border-green-300' : '')}>
                  {selectedProfile?.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{selectedProfile?.employee_count} users</span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => { setEditProfile(selectedProfile!); setEditName(selectedProfile!.profile_name); }}>
                    <Shield className="w-3.5 h-3.5" />Rename
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="h-8 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => { if (confirm(`Delete "${selectedProfile?.profile_name}"?`)) deleteMutation.mutate(selectedId); }}
                    disabled={(selectedProfile?.employee_count ?? 0) > 0}
                    title={(selectedProfile?.employee_count ?? 0) > 0 ? 'Cannot delete profile with active users' : ''}
                  >
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </Button>
                </div>
              </>
            )}
          </div>

          <AccessMatrix profileId={selectedId} />
        </div>
      )}

      {newOpen && (
        <NewProfileDialog
          open
          onClose={() => setNewOpen(false)}
          onCreated={(id) => setSelectedId(id)}
        />
      )}
    </div>
  );
}
