const BASE_URL = "http://127.0.0.1:8000";

// ── Types matching your frontend exactly ────────────────────
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

// ── API functions ────────────────────────────────────────────
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