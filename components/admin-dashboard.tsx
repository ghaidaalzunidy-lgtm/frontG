"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users as UsersIcon,
  Settings as SettingsIcon,
  Activity,
  ListChecks,
  Brain,
  DatabaseBackup,
  Building2,
  Download,
  Pencil,
  Trash2,
} from "lucide-react";
import { Header } from "@/components/header";
import { useApp, translations } from "@/lib/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type AdminRole,
  type AdminUser,
  type AdminDepartment,
  type SystemSettingView,
  type SystemHealth,
  type ActivityLogEntry,
  type ModelInfo,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deactivateAdminUser,
  reactivateAdminUser,
  fetchAdminDepartments,
  createAdminDepartment,
  renameAdminDepartment,
  deleteAdminDepartment,
  fetchAdminSettings,
  updateAdminSetting,
  fetchAdminHealth,
  fetchAdminActivityLogs,
  fetchAdminModel,
  updateAdminModel,
  downloadAdminBackup,
  downloadAdminMessagesCsv,
  restoreAdminBackup,
} from "@/lib/api";

type TabId = "users" | "departments" | "settings" | "health" | "logs" | "exports" | "model" | "backup";

const TABS: { id: TabId; icon: typeof UsersIcon; labelKey: string }[] = [
  // People
  { id: "users", icon: UsersIcon, labelKey: "users" },
  { id: "departments", icon: Building2, labelKey: "departments" },
  // Data & audit
  { id: "exports", icon: Download, labelKey: "exports" },
  { id: "logs", icon: ListChecks, labelKey: "activityLogs" },
  // Configuration
  { id: "settings", icon: SettingsIcon, labelKey: "settings" },
  { id: "model", icon: Brain, labelKey: "model" },
  // Operations
  { id: "health", icon: Activity, labelKey: "systemHealth" },
  { id: "backup", icon: DatabaseBackup, labelKey: "backupRestore" },
];

export function AdminDashboard() {
  const { language, addToast } = useApp();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div className="min-h-screen" dir={language === "ar" ? "rtl" : "ltr"}>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t.adminDashboard}</h1>
        </div>

        <div className="mb-6">
          <div className="flex w-full bg-muted rounded-2xl p-1.5 overflow-x-auto">
            {TABS.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 min-w-[110px] py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="adminTabPill"
                    className="absolute inset-0 bg-card rounded-xl shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon className="h-4 w-4 relative z-10" strokeWidth={1.5} />
                <span className="relative z-10">{t[tab.labelKey as keyof typeof t]}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {activeTab === "users" && <UsersTab onToast={(m, k) => addToast(m, k)} />}
          {activeTab === "departments" && <DepartmentsTab onToast={(m, k) => addToast(m, k)} />}
          {activeTab === "settings" && <SettingsTab onToast={(m, k) => addToast(m, k)} />}
          {activeTab === "health" && <HealthTab onToast={(m, k) => addToast(m, k)} />}
          {activeTab === "logs" && <ActivityLogsTab onToast={(m, k) => addToast(m, k)} />}
          {activeTab === "exports" && <ExportsTab onToast={(m, k) => addToast(m, k)} />}
          {activeTab === "model" && <ModelTab onToast={(m, k) => addToast(m, k)} />}
          {activeTab === "backup" && <BackupTab onToast={(m, k) => addToast(m, k)} />}
        </motion.div>
      </main>
    </div>
  );
}

type ToastFn = (message: string, kind: "success" | "error" | "info") => void;


// ── Users tab ─────────────────────────────────────────────────────
function UsersTab({ onToast }: { onToast: ToastFn }) {
  const { language } = useApp();
  const t = translations[language];
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<AdminRole | "all">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: { role?: AdminRole; is_active?: boolean } = {};
      if (roleFilter !== "all") params.role = roleFilter;
      if (activeFilter !== "all") params.is_active = activeFilter === "active";
      const rows = await fetchAdminUsers(params);
      setUsers(rows);
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [roleFilter, activeFilter]);

  const toggleActive = async (u: AdminUser) => {
    try {
      const next = u.is_active ? await deactivateAdminUser(u.employee_id) : await reactivateAdminUser(u.employee_id);
      setUsers((rows) => rows.map((r) => (r.employee_id === u.employee_id ? next : r)));
      onToast(`${next.name} ${next.is_active ? "reactivated" : "deactivated"}`, "success");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Update failed", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs">{t.role}</Label>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">{t.active}</SelectItem>
              <SelectItem value="inactive">{t.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setNewOpen(true)}>+ {t.newUser}</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">{t.role}</th>
                  <th className="text-left p-3">Department</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!loading && users.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No users</td></tr>
                )}
                {!loading && users.map((u) => (
                  <tr key={u.employee_id} className="border-t">
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3"><Badge variant="secondary">{u.role}</Badge></td>
                    <td className="p-3 text-muted-foreground">{u.department_name ?? "—"}</td>
                    <td className="p-3">
                      {u.is_active
                        ? <Badge className="bg-green-600 hover:bg-green-700">{t.active}</Badge>
                        : <Badge variant="destructive">{t.inactive}</Badge>}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(u)}>Edit</Button>
                      <Button variant={u.is_active ? "destructive" : "default"} size="sm" onClick={() => toggleActive(u)}>
                        {u.is_active ? t.deactivate : t.reactivate}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <NewUserDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(u) => {
          setUsers((rows) => [u, ...rows]);
          onToast(`Created ${u.email}`, "success");
        }}
        onToast={onToast}
      />
      <EditUserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onUpdated={(u) => {
          setUsers((rows) => rows.map((r) => (r.employee_id === u.employee_id ? u : r)));
          onToast(`Updated ${u.email}`, "success");
        }}
        onToast={onToast}
      />
    </div>
  );
}

function useDepartmentList(open: boolean): string[] {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const rows = await fetchAdminDepartments();
        setList(rows.map((r) => r.name));
      } catch {
        // fall back silently — dialog still works with whatever is loaded.
      }
    })();
  }, [open]);
  return list;
}

function NewUserDialog({ open, onClose, onCreated, onToast }: {
  open: boolean;
  onClose: () => void;
  onCreated: (u: AdminUser) => void;
  onToast: ToastFn;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("employee");
  const [department, setDepartment] = useState<string>("");
  const departments = useDepartmentList(open);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (departments.length && !department) setDepartment(departments[0]);
  }, [departments, department]);

  const reset = () => {
    setName(""); setEmail(""); setPassword(""); setRole("employee");
    setDepartment(departments[0] ?? "");
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const user = await createAdminUser({
        name, email, password, role,
        department_name: role === "employee" ? department : undefined,
      });
      onCreated(user);
      reset();
      onClose();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Failed to create user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New User</DialogTitle>
          <DialogDescription>Admin-created accounts skip email verification.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === "employee" && (
            <div>
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger><SelectValue placeholder="Pick…" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !name || !email || !password}>
            {submitting ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, onClose, onUpdated, onToast }: {
  user: AdminUser | null;
  onClose: () => void;
  onUpdated: (u: AdminUser) => void;
  onToast: ToastFn;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("employee");
  const [department, setDepartment] = useState<string>("");
  const departments = useDepartmentList(!!user);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setDepartment(user.department_name ?? "");
    }
  }, [user]);

  if (!user) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      const updated = await updateAdminUser(user.employee_id, {
        name: name !== user.name ? name : undefined,
        email: email !== user.email ? email : undefined,
        role: role !== user.role ? role : undefined,
        department_name: role === "employee" && department !== user.department_name ? department : undefined,
      });
      onUpdated(updated);
      onClose();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Failed to update user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === "employee" && (
            <div>
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger><SelectValue placeholder="Pick…" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Departments tab ──────────────────────────────────────────────
function DepartmentsTab({ onToast }: { onToast: ToastFn }) {
  const { language } = useApp();
  const t = translations[language];
  const [rows, setRows] = useState<AdminDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busy, setBusy] = useState<number | "new" | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await fetchAdminDepartments());
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Failed to load departments", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy("new");
    try {
      const d = await createAdminDepartment(name);
      setRows((rs) => [...rs, d].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      onToast(`Created "${d.name}"`, "success");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const saveRename = async (id: number) => {
    const name = editingName.trim();
    if (!name) return;
    setBusy(id);
    try {
      const d = await renameAdminDepartment(id, name);
      setRows((rs) => rs.map((r) => (r.department_id === id ? d : r)).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      onToast("Renamed", "success");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (d: AdminDepartment) => {
    if (d.employee_count > 0) {
      onToast(`Cannot delete — ${d.employee_count} employee(s) attached`, "error");
      return;
    }
    if (!window.confirm(`Delete department "${d.name}"?`)) return;
    setBusy(d.department_id);
    try {
      await deleteAdminDepartment(d.department_id);
      setRows((rs) => rs.filter((r) => r.department_id !== d.department_id));
      onToast(`Deleted "${d.name}"`, "success");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm">{t.addDepartment}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[220px]">
            <Label className="text-xs">{t.departmentName}</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Engineering"
              onKeyDown={(e) => { if (e.key === "Enter") void add(); }}
            />
          </div>
          <Button onClick={add} disabled={busy === "new" || !newName.trim()}>
            {busy === "new" ? "…" : t.addDepartment}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Employees</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">No departments yet</td></tr>
                )}
                {!loading && rows.map((d) => (
                  <tr key={d.department_id} className="border-t">
                    <td className="p-3">
                      {editingId === d.department_id ? (
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") void saveRename(d.department_id); }}
                          className="w-64"
                        />
                      ) : (
                        <span className="font-medium">{d.name}</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{d.employee_count}</td>
                    <td className="p-3 text-right space-x-2">
                      {editingId === d.department_id ? (
                        <>
                          <Button size="sm" onClick={() => saveRename(d.department_id)} disabled={busy === d.department_id}>
                            {t.save}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => { setEditingId(d.department_id); setEditingName(d.name); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => remove(d)} disabled={busy === d.department_id || d.employee_count > 0}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Exports tab ──────────────────────────────────────────────────
function ExportsTab({ onToast }: { onToast: ToastFn }) {
  const { language } = useApp();
  const t = translations[language];
  const [busy, setBusy] = useState(false);

  const exportCsv = async () => {
    setBusy(true);
    try {
      await downloadAdminMessagesCsv();
      onToast("CSV downloaded", "success");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Export failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{t.exportMessagesCsv}</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">{t.exportMessagesDesc}</p>
        <Button onClick={exportCsv} disabled={busy}>
          <Download className="h-4 w-4 mr-1" />
          {busy ? "…" : t.exportMessagesCsv}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Settings tab ──────────────────────────────────────────────────
function SettingsTab({ onToast }: { onToast: ToastFn }) {
  const { language } = useApp();
  const t = translations[language];
  const [items, setItems] = useState<SystemSettingView[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await fetchAdminSettings();
      setItems(rows);
      setDraft(Object.fromEntries(rows.map((r) => [r.key, String(r.value)])));
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const save = async (s: SystemSettingView) => {
    setSaving(s.key);
    try {
      const rawValue: number | string | boolean =
        s.type === "float" ? parseFloat(draft[s.key])
        : s.type === "int" ? parseInt(draft[s.key], 10)
        : s.type === "bool" ? draft[s.key] === "true"
        : draft[s.key];
      const updated = await updateAdminSetting(s.key, rawValue);
      setItems((rows) => rows.map((r) => (r.key === s.key ? updated : r)));
      setDraft((d) => ({ ...d, [s.key]: String(updated.value) }));
      const clamped = String(updated.value) !== String(rawValue);
      onToast(clamped ? `Saved (${t.valueClamped})` : "Saved", clamped ? "info" : "success");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="grid gap-3">
      {items.map((s) => (
        <Card key={s.key}>
          <CardContent className="p-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1">
              <div className="font-medium">{s.key}</div>
              {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
              <div className="text-xs text-muted-foreground mt-1">
                {t.defaultValue}: <code>{String(s.default)}</code>
                {s.min !== null && <> · min: <code>{String(s.min)}</code></>}
                {s.max !== null && <> · max: <code>{String(s.max)}</code></>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                className="w-48"
                value={draft[s.key] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [s.key]: e.target.value }))}
              />
              <Button onClick={() => save(s)} disabled={saving === s.key}>
                {saving === s.key ? "…" : t.save}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Health tab ────────────────────────────────────────────────────
function HealthTab({ onToast }: { onToast: ToastFn }) {
  const { language } = useApp();
  const t = translations[language];
  const [data, setData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const d = await fetchAdminHealth();
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) onToast(e instanceof Error ? e.message : "Health check failed", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void tick();
    const id = setInterval(tick, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (loading || !data) return <div className="text-muted-foreground">Loading…</div>;

  const diskPct = data.disk.total > 0 ? Math.round((data.disk.used / data.disk.total) * 100) : 0;
  const fmtBytes = (n: number) => {
    const u = ["B", "KB", "MB", "GB", "TB"];
    let i = 0; let v = n;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(1)} ${u[i]}`;
  };
  const fmtSecs = (n: number) => {
    const d = Math.floor(n / 86400);
    const h = Math.floor((n % 86400) / 3600);
    const m = Math.floor((n % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="grid md:grid-cols-3 gap-3">
      <Card>
        <CardHeader><CardTitle className="text-sm">{t.dbStatus}</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.db_ok ? "OK" : "DOWN"}</div>
          <div className="text-xs text-muted-foreground">{data.now}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">{t.uptime}</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fmtSecs(data.uptime_seconds)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">{t.diskUsage}</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{diskPct}%</div>
          <div className="text-xs text-muted-foreground">
            {fmtBytes(data.disk.used)} / {fmtBytes(data.disk.total)}
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-sm">{t.counts}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {Object.entries(data.counts).map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="text-lg font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">{t.loginFailures24h}</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.recent_login_failures_24h}</div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Activity logs tab ─────────────────────────────────────────────
function ActivityLogsTab({ onToast }: { onToast: ToastFn }) {
  const [rows, setRows] = useState<ActivityLogEntry[]>([]);
  const [actorRole, setActorRole] = useState<string>("all");
  const [action, setAction] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminActivityLogs({
        actor_role: actorRole === "all" ? undefined : actorRole,
        action: action || undefined,
        limit: 200,
      });
      setRows(list);
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Failed to load logs", "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [actorRole]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs">Actor role</Label>
          <Select value={actorRole} onValueChange={setActorRole}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="hr">HR</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Action</Label>
          <div className="flex gap-2">
            <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="user.update" className="w-[220px]" />
            <Button variant="outline" onClick={load}>Apply</Button>
          </div>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left p-3">When</th>
                  <th className="text-left p-3">Actor</th>
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">Target</th>
                  <th className="text-left p-3">Meta</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
                {!loading && rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No entries</td></tr>}
                {!loading && rows.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-3">{r.actor_role ?? "—"}<div className="text-xs text-muted-foreground">{r.actor_employee_id ?? ""}</div></td>
                    <td className="p-3"><Badge variant="secondary">{r.action}</Badge></td>
                    <td className="p-3 text-muted-foreground">{r.target_type ?? ""} {r.target_id ?? ""}</td>
                    <td className="p-3"><code className="text-xs">{r.meta ? JSON.stringify(r.meta) : ""}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Model tab ─────────────────────────────────────────────────────
function ModelTab({ onToast }: { onToast: ToastFn }) {
  const { language } = useApp();
  const t = translations[language];
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [draftId, setDraftId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await fetchAdminModel();
        setInfo(d);
        setDraftId(d.current_model_hub_id);
      } catch (e) {
        onToast(e instanceof Error ? e.message : "Failed to load model info", "error");
      }
    })();
  }, []);

  const save = async () => {
    setSubmitting(true);
    try {
      const updated = await updateAdminModel(draftId.trim());
      setInfo((cur) => cur ? { ...cur, current_model_hub_id: updated.current_model_hub_id } : cur);
      onToast(`Model reloaded: ${updated.current_model_hub_id}`, "success");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Model update failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!info) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Card>
        <CardHeader><CardTitle className="text-sm">Current model</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">Hub ID: </span><code>{info.current_model_hub_id}</code></div>
          <div><span className="text-muted-foreground">Cache: </span><code>{info.cache_root}</code></div>
          <div><span className="text-muted-foreground">Cache size: </span>{(info.cache_size_bytes / 1024 / 1024).toFixed(1)} MB</div>
          <div><span className="text-muted-foreground">Device hint: </span>{info.device_hint}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">{t.uploadModel}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Label className="text-xs">{t.modelHubId}</Label>
          <Input value={draftId} onChange={(e) => setDraftId(e.target.value)} placeholder="org/model-name" />
          <Button onClick={save} disabled={submitting || !draftId.includes("/")}>
            {submitting ? "Reloading…" : "Apply & Reload"}
          </Button>
          <p className="text-xs text-muted-foreground">
            The model is downloaded from HuggingFace Hub on first call after reload.
            Retraining on stored reflections is out of scope to preserve employee privacy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Backup tab ────────────────────────────────────────────────────
function BackupTab({ onToast }: { onToast: ToastFn }) {
  const { language } = useApp();
  const t = translations[language];
  const [downloading, setDownloading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [confirm, setConfirm] = useState("");
  const [restoring, setRestoring] = useState(false);

  const doDownload = async () => {
    setDownloading(true);
    try {
      await downloadAdminBackup();
      onToast("Backup downloaded", "success");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Backup failed", "error");
    } finally {
      setDownloading(false);
    }
  };

  const doRestore = async () => {
    if (!file) return;
    if (confirm !== "RESTORE") {
      onToast(t.confirmRestore, "error");
      return;
    }
    setRestoring(true);
    try {
      const r = await restoreAdminBackup(file);
      onToast(`Restored. Pre-restore backup at ${r.pre_restore_backup}`, "success");
      setFile(null);
      setConfirm("");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Restore failed", "error");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <Card>
        <CardHeader><CardTitle className="text-sm">Backup</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">Streams a SQL dump of the database.</p>
          <Button onClick={doDownload} disabled={downloading}>
            {downloading ? "…" : t.downloadBackup}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Restore</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Destructive. A pre-restore backup is taken automatically.
          </p>
          <Input
            type="file"
            accept=".sql"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Input
            placeholder={t.confirmRestore}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button variant="destructive" onClick={doRestore} disabled={restoring || !file || confirm !== "RESTORE"}>
            {restoring ? "Restoring…" : "Restore from .sql"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
