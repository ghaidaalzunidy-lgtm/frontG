const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

// ── Auth helpers ─────────────────────────────────────────────
function getToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token") || "";
  }
  return "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`,
  };
}

// ── Types ────────────────────────────────────────────────────
export interface DepartmentData {
  name: string;
  messages: number;
  employees: number;
}

export interface MonthlyData {
  month: string;
  score: number;
}

export interface MoodData {
  name: string;
  nameAr: string;
  value: number;
  color: string;
}

export interface YearlyData {
  year: string;
  score: number;
}

export interface StatsData {
  totalMessages: string;
  avgMoodScore: string;
  departments: string;
  issuesFlagged: string;
}

export interface MessageInsight {
  id: string;
  department: string;
  emotion: string;
  employeeCount: number;
  date: string;
  themes: string[];
  aiAnalysis: string;
  responded: boolean;
  message: string;
  response?: string;
}

// ── HR Dashboard endpoints ───────────────────────────────────
export async function fetchStats(): Promise<StatsData> {
  const res = await fetch(`${BASE_URL}/api/hr/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchDepartments(): Promise<DepartmentData[]> {
  const res = await fetch(`${BASE_URL}/api/hr/departments`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch departments");
  return res.json();
}

export async function fetchMonthlyTrends(): Promise<MonthlyData[]> {
  const res = await fetch(`${BASE_URL}/api/hr/monthly-trends`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch monthly trends");
  return res.json();
}

export async function fetchMoodDistribution(): Promise<MoodData[]> {
  const res = await fetch(`${BASE_URL}/api/hr/mood-distribution`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch mood distribution");
  return res.json();
}

export async function fetchYearlyTrends(): Promise<YearlyData[]> {
  const res = await fetch(`${BASE_URL}/api/hr/yearly-trends`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch yearly trends");
  return res.json();
}

// ── HR Messages ──────────────────────────────────────────────
export async function fetchMessages(): Promise<MessageInsight[]> {
  const res = await fetch(`${BASE_URL}/api/hr/messages`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function fetchTotalEmployees(): Promise<number> {
  const res = await fetch(`${BASE_URL}/api/hr/total-employees`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch total employees");
  const data = (await res.json()) as { totalEmployees: number };
  return data.totalEmployees;
}

export interface CriticalAlert {
  alert_id: number;
  employee_id: number;
  employee_name: string;
  department_id: number | null;
  department_name: string | null;
  matched_keyword: string;
  snippet: string;
  severity: "low" | "medium" | "high" | "critical";
  is_resolved: boolean;
  created_at: string | null;
}

export async function fetchCriticalAlerts(
  includeResolved = false,
): Promise<CriticalAlert[]> {
  const url = new URL(`${BASE_URL}/api/hr/critical-alerts`);
  if (includeResolved) url.searchParams.set("include_resolved", "true");
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch critical alerts");
  return res.json();
}

export async function resolveCriticalAlert(alertId: number): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/api/hr/critical-alerts/${alertId}/resolve`,
    { method: "POST", headers: authHeaders() },
  );
  if (!res.ok) throw new Error("Failed to resolve alert");
}

// ── Department alarms (HR only) ──────────────────────────────
// Aggregated 7-day per-department severity rollups produced by the daily
// scheduler in MOODLOOP-backedn/app/utils/alarm.py. Backend gates the route
// hr_only; admins cannot read this without a backend change. The `message`
// column on the underlying table is intentionally NOT exposed here — it's
// English-only; the UI renders structured fields and localizes labels.
export interface DepartmentAlarm {
  alarm_id: number;
  department_id: number;
  department_name: string | null;
  severity: "low" | "medium" | "high" | "critical";
  negative_ratio: number;
  analyses_count: number;
  window_start: string | null;
  window_end: string | null;
  created_at: string | null;
}

export async function fetchDepartmentAlarms(): Promise<DepartmentAlarm[]> {
  const res = await fetch(`${BASE_URL}/alarms/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch department alarms");
  return res.json();
}

// ── HR Profile ───────────────────────────────────────────────
export async function fetchHRProfile() {
  const res = await fetch(`${BASE_URL}/api/hr/profile`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateHRProfile(data: {
  name?: string;
  phone?: string;
  bio?: string;
  position?: string;
}) {
  const res = await fetch(`${BASE_URL}/api/hr/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

// ── Reflections (AraBERT) ────────────────────────────────────
export interface ReflectionResponse {
  reflection_id: number;
  employee_id: number;
  department_id: number;
  input_text: string;
  cleaned_text?: string | null;
  wellness_tip?: string | null;
  created_at: string;
  predicted_emotion?: string | null;
  confidence?: number | null;
}

export interface EmotionPrediction {
  emotion: string;
  intensity: number;
  all_scores: Record<string, number>;
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) return body.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ") || fallback;
  } catch {}
  return fallback;
}

export async function submitReflection(input_text: string, selected_emotion?: string | null): Promise<ReflectionResponse> {
  const res = await fetch(`${BASE_URL}/reflections/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ input_text, department_id: 0, selected_emotion: selected_emotion || null }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to submit reflection"));
  return res.json();
}

export async function predictEmotion(input_text: string): Promise<EmotionPrediction> {
  const res = await fetch(`${BASE_URL}/reflections/predict-only`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ input_text }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to predict emotion"));
  return res.json();
}

// ── Admin ─────────────────────────────────────────────────────
export type AdminRole = "employee" | "hr" | "admin";

export interface AdminUser {
  employee_id: number;
  name: string;
  email: string;
  role: AdminRole;
  department_id: number | null;
  department_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string | null;
}

export interface AdminUserCreate {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  department_name?: string;
}

export interface AdminUserUpdate {
  name?: string;
  email?: string;
  role?: AdminRole;
  department_name?: string;
  is_active?: boolean;
}

export interface SystemSettingView {
  key: string;
  value: number | string | boolean;
  type: "float" | "int" | "bool" | "string";
  min: number | null;
  max: number | null;
  default: number | string | boolean;
  description: string | null;
  updated_at: string | null;
}

export interface SystemHealth {
  db_ok: boolean;
  uptime_seconds: number;
  disk: { total: number; used: number; free: number };
  counts: Record<string, number>;
  recent_login_failures_24h: number;
  now: string;
}

export interface ActivityLogEntry {
  id: number;
  actor_employee_id: number | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

export interface ModelInfo {
  current_model_hub_id: string;
  cache_root: string;
  cache_size_bytes: number;
  device_hint: string;
}

export async function adminLogin(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const res = await fetch(`${BASE_URL}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Login failed"));
  return res.json();
}

export async function fetchAdminUsers(params: { role?: AdminRole; is_active?: boolean } = {}): Promise<AdminUser[]> {
  const qs = new URLSearchParams();
  if (params.role) qs.set("role", params.role);
  if (params.is_active !== undefined) qs.set("is_active", String(params.is_active));
  const res = await fetch(`${BASE_URL}/api/admin/users?${qs.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Failed to fetch users"));
  return res.json();
}

export async function createAdminUser(payload: AdminUserCreate): Promise<AdminUser> {
  const res = await fetch(`${BASE_URL}/api/admin/users`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to create user"));
  return res.json();
}

export async function updateAdminUser(id: number, payload: AdminUserUpdate): Promise<AdminUser> {
  const res = await fetch(`${BASE_URL}/api/admin/users/${id}`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to update user"));
  return res.json();
}

export async function deactivateAdminUser(id: number): Promise<AdminUser> {
  const res = await fetch(`${BASE_URL}/api/admin/users/${id}/deactivate`, { method: "POST", headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Failed to deactivate user"));
  return res.json();
}

export async function reactivateAdminUser(id: number): Promise<AdminUser> {
  const res = await fetch(`${BASE_URL}/api/admin/users/${id}/reactivate`, { method: "POST", headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Failed to reactivate user"));
  return res.json();
}

export async function fetchAdminSettings(): Promise<SystemSettingView[]> {
  const res = await fetch(`${BASE_URL}/api/admin/settings`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Failed to fetch settings"));
  return res.json();
}

export async function updateAdminSetting(key: string, value: number | string | boolean): Promise<SystemSettingView> {
  const res = await fetch(`${BASE_URL}/api/admin/settings/${key}`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to update setting"));
  return res.json();
}

export async function fetchAdminHealth(): Promise<SystemHealth> {
  const res = await fetch(`${BASE_URL}/api/admin/system/health`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Failed to fetch system health"));
  return res.json();
}

export async function fetchAdminActivityLogs(params: { actor_role?: string; action?: string; limit?: number; offset?: number } = {}): Promise<ActivityLogEntry[]> {
  const qs = new URLSearchParams();
  if (params.actor_role) qs.set("actor_role", params.actor_role);
  if (params.action) qs.set("action", params.action);
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  if (params.offset !== undefined) qs.set("offset", String(params.offset));
  const res = await fetch(`${BASE_URL}/api/admin/activity-logs?${qs.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Failed to fetch activity logs"));
  return res.json();
}

export async function fetchAdminModel(): Promise<ModelInfo> {
  const res = await fetch(`${BASE_URL}/api/admin/model`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Failed to fetch model info"));
  return res.json();
}

export async function updateAdminModel(model_hub_id: string): Promise<{ current_model_hub_id: string; reloaded: boolean }> {
  const res = await fetch(`${BASE_URL}/api/admin/model`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ model_hub_id }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to update model"));
  return res.json();
}

export async function downloadAdminBackup(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/backup`, { method: "POST", headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Backup failed"));
  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  const filename = cd.split("filename=")[1]?.replaceAll('"', "").trim() || "moodloop-backup.sql";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface AdminDepartment {
  department_id: number;
  name: string;
  employee_count: number;
}

export async function fetchAdminDepartments(): Promise<AdminDepartment[]> {
  const res = await fetch(`${BASE_URL}/api/admin/departments`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Failed to fetch departments"));
  return res.json();
}

export async function createAdminDepartment(name: string): Promise<AdminDepartment> {
  const res = await fetch(`${BASE_URL}/api/admin/departments`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to create department"));
  return res.json();
}

export async function renameAdminDepartment(id: number, name: string): Promise<AdminDepartment> {
  const res = await fetch(`${BASE_URL}/api/admin/departments/${id}`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to rename department"));
  return res.json();
}

export async function deleteAdminDepartment(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/departments/${id}`, {
    method: "DELETE", headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error(await parseError(res, "Failed to delete department"));
}

export async function downloadAdminMessagesCsv(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/messages.csv`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "CSV export failed"));
  const blob = await res.blob();
  const cd = res.headers.get("content-disposition") || "";
  const filename = cd.split("filename=")[1]?.replaceAll('"', "").trim() || "moodloop-messages.csv";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function restoreAdminBackup(file: File): Promise<{ restored: boolean; pre_restore_backup: string }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("confirm", "RESTORE");
  const res = await fetch(`${BASE_URL}/api/admin/restore`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${getToken()}` },
    body: fd,
  });
  if (!res.ok) throw new Error(await parseError(res, "Restore failed"));
  return res.json();
}