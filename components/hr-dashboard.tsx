"use client";

import { useEffect, useState } from "react";
import {
  fetchStats,
  fetchDepartments,
  fetchMonthlyTrends,
  fetchMoodDistribution,
  fetchYearlyTrends,
  fetchCriticalAlerts,
  resolveCriticalAlert,
  type DepartmentData,
  type MonthlyData,
  type MoodData,
  type YearlyData,
  type StatsData,
  type CriticalAlert,
} from "@/lib/api";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  User,
  TrendingUp,
  Building2,
  AlertCircle,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { HRMessages } from "@/components/hr-messages";
import { HRProfile } from "@/components/hr-profile";
import { useApp, translations } from "@/lib/app-context";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const tabs = [
  { id: "dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { id: "messages", icon: MessageSquare, labelKey: "messages" },
  { id: "profile", icon: User, labelKey: "profile" },
];

export function HRDashboard() {
  const { language } = useApp();
  const t = translations[language];
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen" dir={language === "ar" ? "rtl" : "ltr"}>
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="flex w-full bg-muted rounded-2xl p-1.5">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-card rounded-xl shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon className="h-4 w-4 relative z-10" strokeWidth={1.5} />
                <span className="relative z-10">
                  {t[tab.labelKey as keyof typeof t]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "dashboard" && <DashboardContent />}
          {activeTab === "messages" && <HRMessages />}
          {activeTab === "profile" && <HRProfile />}
        </motion.div>
      </main>
    </div>
  );
}

function DashboardContent() {
  const { language } = useApp();
  const t = translations[language];

  // ── Real data from backend ───────────────────────────────
  const [deptData,    setDeptData]    = useState<DepartmentData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [moodData,    setMoodData]    = useState<MoodData[]>([]);
  const [yearlyData,  setYearlyData]  = useState<YearlyData[]>([]);
  const [statsData,   setStatsData]   = useState<StatsData | null>(null);
  const [alerts,      setAlerts]      = useState<CriticalAlert[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const [stats, depts, monthly, mood, yearly, criticalAlerts] = await Promise.all([
          fetchStats(),
          fetchDepartments(),
          fetchMonthlyTrends(),
          fetchMoodDistribution(),
          fetchYearlyTrends(),
          fetchCriticalAlerts(),
        ]);
        setStatsData(stats);
        setDeptData(depts);
        setMonthlyData(monthly);
        setMoodData(mood);
        setYearlyData(yearly);
        setAlerts(criticalAlerts);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  // ── Stats cards from real data ───────────────────────────
  const stats = statsData ? [
    {
      title: "totalMessages",
      value: statsData.totalMessages.toString(),
      change: "from database",
      changeType: "positive" as const,
      icon: MessageSquare,
    },
    {
      title: "avgMoodScore",
      value: statsData.avgMoodScore,
      change: "current average",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      title: "departments",
      value: statsData.departments,
      change: "Active departments",
      changeType: "neutral" as const,
      icon: Building2,
    },
    {
      title: "issuesFlagged",
      value: statsData.issuesFlagged,
      change: "Needs attention",
      changeType: "negative" as const,
      icon: AlertCircle,
    },
  ] : [];

  const localMoodData = moodData.map((d) => ({
    ...d,
    name: language === "ar" ? d.nameAr : d.name,
  }));

  const handleResolveAlert = async (alertId: number) => {
    try {
      await resolveCriticalAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
      setStatsData((prev) =>
        prev
          ? {
              ...prev,
              issuesFlagged: String(Math.max(0, Number(prev.issuesFlagged) - 1)),
            }
          : prev,
      );
    } catch (e) {
      console.error("Failed to resolve alert:", e);
    }
  };

  const formatAlertTime = (iso: string | null): string => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString(language === "ar" ? "ar" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const RADIAN = Math.PI / 180;
  const renderInsideLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, value,
  }: {
    cx: number; cy: number; midAngle: number;
    innerRadius: number; outerRadius: number; value: number;
  }) => {
    if (value < 10) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle"
        dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${value}%`}
      </text>
    );
  };

  // ── Loading spinner ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t.analyticsDashboard}
        </h1>
        <p className="text-muted-foreground">{t.overviewWellbeing}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.length === 0 ? (
          <div className="col-span-4 text-center text-muted-foreground py-8">
            No data yet — waiting for employees to submit reflections.
          </div>
        ) : (
          stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm cursor-default hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">
                      {t[stat.title as keyof typeof t]}
                    </span>
                    <stat.icon
                      className={`h-5 w-5 ${
                        stat.changeType === "negative" ? "text-red-500" : "text-primary"
                      }`}
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className={`text-sm mt-1 flex items-center gap-1 ${
                    stat.changeType === "positive" ? "text-green-600"
                    : stat.changeType === "negative" ? "text-red-500"
                    : "text-muted-foreground"
                  }`}>
                    {stat.changeType === "positive" && <TrendingUp className="h-3 w-3" strokeWidth={1.5} />}
                    {stat.changeType === "negative" && <TrendingDown className="h-3 w-3" strokeWidth={1.5} />}
                    {stat.change}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Critical Keyword Alerts */}
      {alerts.length > 0 && (
        <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm border-l-4 border-l-red-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" strokeWidth={1.5} />
              <CardTitle className="text-red-600">
                {language === "ar" ? "تنبيهات حرجة" : "Critical alerts"}
              </CardTitle>
              <Badge variant="destructive" className="ml-1">
                {alerts.length}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "ar"
                ? "تم رصد كلمات مفتاحية تستدعي تدخلاً فورياً من قسم الموارد البشرية."
                : "Keywords indicating possible self-harm or severe distress were detected. Immediate HR follow-up recommended."}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.alert_id}
                className="rounded-xl border border-red-200/60 bg-red-50/40 dark:bg-red-950/20 p-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">
                        {alert.employee_name}
                      </span>
                      {alert.department_name && (
                        <Badge variant="outline" className="text-xs">
                          {alert.department_name}
                        </Badge>
                      )}
                      <Badge variant="destructive" className="text-xs uppercase">
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatAlertTime(alert.created_at)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {language === "ar" ? "كلمة مرصودة: " : "Matched: "}
                      </span>
                      <span
                        className="font-mono px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                        dir="rtl"
                      >
                        {alert.matched_keyword}
                      </span>
                    </div>
                    <p
                      className="text-sm text-muted-foreground italic break-words"
                      dir="rtl"
                    >
                      “{alert.snippet}”
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`mailto:?subject=${encodeURIComponent(
                        language === "ar"
                          ? "متابعة عاجلة"
                          : "Urgent wellbeing check-in",
                      )}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {language === "ar" ? "تواصل" : "Reach out"}
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveAlert(alert.alert_id)}
                      className="cursor-pointer"
                    >
                      {language === "ar" ? "تم الحل" : "Mark resolved"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Department Comparison */}
      <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{t.departmentComparison}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {deptData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No department data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="messages" fill="#614EA9" name="Message Count" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="employees" fill="#C3B4FF" name="Employee Count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends & Mood Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-left">{t.monthlyTrends}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No monthly data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#614EA9"
                      strokeWidth={2}
                      name="Mood Score"
                      dot={{ fill: "#614EA9" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t.currentMoodDist}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {localMoodData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No mood data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={localMoodData}
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      dataKey="value"
                      label={renderInsideLabel}
                      labelLine={false}
                    >
                      {localMoodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`]} />
                    <Legend wrapperStyle={{ fontSize: "13px", fontWeight: 600 }} iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year-over-Year */}
      <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{t.yoyImprovement}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[200px]">
            {yearlyData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No yearly data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData}>
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#614EA9" name="Average Mood Score" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">{t.greatProgress}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}