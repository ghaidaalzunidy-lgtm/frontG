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

export async function submitReflection(input_text: string): Promise<ReflectionResponse> {
  const res = await fetch(`${BASE_URL}/reflections/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ input_text, department_id: 0 }),
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