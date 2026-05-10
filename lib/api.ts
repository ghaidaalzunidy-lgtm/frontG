const BASE_URL = "http://127.0.0.1:8000";

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
  const res = await fetch(`${BASE_URL}/api/hr/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchDepartments(): Promise<DepartmentData[]> {
  const res = await fetch(`${BASE_URL}/api/hr/departments`);
  if (!res.ok) throw new Error("Failed to fetch departments");
  return res.json();
}

export async function fetchMonthlyTrends(): Promise<MonthlyData[]> {
  const res = await fetch(`${BASE_URL}/api/hr/monthly-trends`);
  if (!res.ok) throw new Error("Failed to fetch monthly trends");
  return res.json();
}

export async function fetchMoodDistribution(): Promise<MoodData[]> {
  const res = await fetch(`${BASE_URL}/api/hr/mood-distribution`);
  if (!res.ok) throw new Error("Failed to fetch mood distribution");
  return res.json();
}

export async function fetchYearlyTrends(): Promise<YearlyData[]> {
  const res = await fetch(`${BASE_URL}/api/hr/yearly-trends`);
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