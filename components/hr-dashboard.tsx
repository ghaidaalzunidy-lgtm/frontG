"use client";

import { useState } from "react";
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
} from "lucide-react";
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

const departmentData = [
  { name: "Accounting", messages: 15, employees: 23 },
  { name: "Maintenance", messages: 18, employees: 22 },
  { name: "HR", messages: 8, employees: 12 },
  { name: "IT", messages: 28, employees: 31 },
  { name: "Sales", messages: 26, employees: 35 },
  { name: "Marketing", messages: 14, employees: 16 },
];

const monthlyData = [
  { month: "Jan", score: 3.2 },
  { month: "Feb", score: 3.3 },
  { month: "Mar", score: 3.2 },
  { month: "Apr", score: 3.5 },
  { month: "May", score: 3.8 },
  { month: "Jun", score: 4.0 },
  { month: "Jul", score: 4.1 },
  { month: "Aug", score: 4.2 },
];

const moodDistribution = [
  { name: "Happiness", nameAr: "السعادة", value: 28, color: "#22c55e" },
  { name: "Motivation", nameAr: "الدافعية", value: 18, color: "#f97316" },
  { name: "Cooperation", nameAr: "التعاون", value: 15, color: "#3b82f6" },
  { name: "Calmness", nameAr: "الهدوء", value: 12, color: "#6b7280" },
  { name: "Stress", nameAr: "التوتر", value: 14, color: "#eab308" },
  { name: "Frustration", nameAr: "الإحباط", value: 8, color: "#ef4444" },
  { name: "Sadness", nameAr: "الحزن", value: 5, color: "#8b5cf6" },
];

const yearlyData = [
  { year: "2023", score: 2.9 },
  { year: "2024", score: 3.4 },
  { year: "2025", score: 3.6 },
];

const stats = [
  {
    title: "totalMessages",
    value: "126",
    change: "12% from last month",
    changeType: "positive",
    icon: MessageSquare,
  },
  {
    title: "avgMoodScore",
    value: "3.6/5.0",
    change: "0.4 improvement",
    changeType: "positive",
    icon: TrendingUp,
  },
  {
    title: "departments",
    value: "6",
    change: "Active departments",
    changeType: "neutral",
    icon: Building2,
  },
  {
    title: "issuesFlagged",
    value: "8",
    change: "Needs attention",
    changeType: "negative",
    icon: AlertCircle,
  },
];

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
        {/* Enhanced Tabs with Framer Motion pill */}
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

        {/* Tab Content */}
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

  const localMoodData = moodDistribution.map((d) => ({
    ...d,
    name: language === "ar" ? d.nameAr : d.name,
  }));

  const RADIAN = Math.PI / 180;
  const renderInsideLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    value,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    value: number;
  }) => {
    if (value < 10) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
      >
        {`${value}%`}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t.analyticsDashboard}
        </h1>
        <p className="text-muted-foreground">{t.overviewWellbeing}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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
                      stat.changeType === "negative"
                        ? "text-red-500"
                        : "text-primary"
                    }`}
                    strokeWidth={1.5}
                  />
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div
                  className={`text-sm mt-1 flex items-center gap-1 ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : stat.changeType === "negative"
                        ? "text-red-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {stat.changeType === "positive" && (
                    <TrendingUp className="h-3 w-3" strokeWidth={1.5} />
                  )}
                  {stat.changeType === "negative" && (
                    <TrendingDown className="h-3 w-3" strokeWidth={1.5} />
                  )}
                  {stat.change}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Department Comparison */}
      <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{t.departmentComparison}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="messages"
                  fill="#614EA9"
                  name="Message Count"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="employees"
                  fill="#C3B4FF"
                  name="Employee Count"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
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
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{t.currentMoodDist}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
                  <Legend
                    wrapperStyle={{ fontSize: "13px", fontWeight: 600 }}
                    iconSize={10}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year-over-Year Improvement */}
      <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{t.yoyImprovement}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData}>
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="score"
                  fill="#614EA9"
                  name="Average Mood Score"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10 flex items-start gap-3">
            <CheckCircle
              className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5"
              strokeWidth={1.5}
            />
            <p className="text-sm text-muted-foreground">{t.greatProgress}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

