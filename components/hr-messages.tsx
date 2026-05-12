"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchMessages, fetchTotalEmployees, type MessageInsight } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Lock, Clock, Search, Filter,
  TrendingUp, Calendar, X, Send, MessageCircle,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { emotions, useApp, translations } from "@/lib/app-context";

const emotionEmojis: Record<string, string> = {
  "Happiness / Satisfaction": "😊",
  "Motivation / Excitement": "🤩",
  "Cooperation / Team Spirit": "🤝",
  "Calmness / Neutral": "😐",
  "Stress / Anxiety": "😣",
  "Frustration / Anger": "😠",
  "Sadness / Burnout": "😢",
};

const emotionColors: Record<string, string> = {
  "Happiness / Satisfaction": "text-green-600",
  "Motivation / Excitement": "text-orange-500",
  "Cooperation / Team Spirit": "text-yellow-500",
  "Calmness / Neutral": "text-gray-500",
  "Stress / Anxiety": "text-red-500",
  "Frustration / Anger": "text-red-600",
  "Sadness / Burnout": "text-blue-500",
};

const POSITIVE_EMOTIONS = new Set([
  "Happiness / Satisfaction",
  "Motivation / Excitement",
  "Cooperation / Team Spirit",
]);
const NEGATIVE_EMOTIONS = new Set([
  "Stress / Anxiety",
  "Frustration / Anger",
  "Sadness / Burnout",
]);

type Severity = "positive" | "negative" | "neutral";

function classifyEmotion(label: string): Severity {
  if (POSITIVE_EMOTIONS.has(label)) return "positive";
  if (NEGATIVE_EMOTIONS.has(label)) return "negative";
  return "neutral";
}

const parseDate = (dateStr: string) => {
  const [month, day, year] = dateStr.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

export function HRMessages() {
  const { language } = useApp();
  const t = translations[language];

  const [searchQuery, setSearchQuery]           = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [emotionFilter, setEmotionFilter]       = useState("all");
  const [timeFilter, setTimeFilter]             = useState("all");
  const [insights, setInsights]                 = useState<MessageInsight[]>([]);
  const [totalEmployees, setTotalEmployees]     = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [respondingTo, setRespondingTo]         = useState<string | null>(null);
  const [responseText, setResponseText]         = useState("");
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetchMessages().then(setInsights),
      fetchTotalEmployees().then(setTotalEmployees),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getDateRange = (filter: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    switch (filter) {
      case "day":   return { start: today, end: tomorrow };
      case "week":  return { start: startOfWeek, end: tomorrow };
      case "month": return { start: startOfMonth, end: tomorrow };
      default:      return null;
    }
  };

  const filteredInsights = insights.filter((insight) => {
    const matchesSearch =
      insight.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.aiAnalysis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.themes.some((theme) =>
        theme.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesDepartment =
      departmentFilter === "all" || insight.department.includes(departmentFilter);
    const matchesEmotion =
      emotionFilter === "all" || insight.emotion.includes(emotionFilter);
    let matchesTime = true;
    if (timeFilter !== "all") {
      const dateRange = getDateRange(timeFilter);
      if (dateRange) {
        const insightDate = parseDate(insight.date);
        matchesTime = insightDate >= dateRange.start && insightDate < dateRange.end;
      }
    }
    return matchesSearch && matchesDepartment && matchesEmotion && matchesTime;
  });

  // Group filtered insights by department; sort messages newest-first within each.
  const grouped = useMemo(() => {
    const map = new Map<string, MessageInsight[]>();
    for (const insight of filteredInsights) {
      if (!map.has(insight.department)) map.set(insight.department, []);
      map.get(insight.department)!.push(insight);
    }
    for (const [, list] of map) {
      list.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredInsights]);

  const summary = useMemo(() => {
    let positive = 0, neutral = 0, negative = 0;
    for (const insight of filteredInsights) {
      const cls = classifyEmotion(insight.emotion);
      if (cls === "positive") positive++;
      else if (cls === "negative") negative++;
      else neutral++;
    }
    const total = positive + neutral + negative;
    return { positive, neutral, negative, total };
  }, [filteredInsights]);

  const departmentSeverity = (messages: MessageInsight[]): Severity => {
    let pos = 0, neg = 0;
    for (const m of messages) {
      const cls = classifyEmotion(m.emotion);
      if (cls === "positive") pos++;
      else if (cls === "negative") neg++;
    }
    if (neg > pos) return "negative";
    if (pos > neg) return "positive";
    return "neutral";
  };

  const toggleDepartment = (dept: string) => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  };

  const allExpanded =
    grouped.length > 0 && grouped.every(([dept]) => expandedDepartments.has(dept));

  const toggleAll = () => {
    if (allExpanded) setExpandedDepartments(new Set());
    else setExpandedDepartments(new Set(grouped.map(([d]) => d)));
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setEmotionFilter("all");
    setTimeFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    departmentFilter !== "all" ||
    emotionFilter !== "all" ||
    timeFilter !== "all";

  const emotionLabelForId = (id: string): string => {
    const e = emotions.find((em) => em.id === id);
    if (!e) return id;
    return language === "en" ? e.label : e.labelAr;
  };

  const timeLabelForValue = (v: string): string => {
    const en: Record<string, string> = {
      day: "This Day", week: "This Week", month: "This Month",
    };
    const ar: Record<string, string> = {
      day: "اليوم", week: "هذا الأسبوع", month: "هذا الشهر",
    };
    return (language === "en" ? en : ar)[v] ?? v;
  };

  const severityBorderClass = (s: Severity) => {
    if (s === "positive") return "border-l-4 border-l-green-500";
    if (s === "negative") return "border-l-4 border-l-red-500";
    return "border-l-4 border-l-gray-400";
  };

  // Dead respond logic kept intentionally — to be wired or removed in a separate task.
  const handleRespond = (id: string) => {
    if (!responseText.trim()) return;
    setInsights((prev) =>
      prev.map((insight) =>
        insight.id === id
          ? { ...insight, responded: true, response: responseText }
          : insight
      )
    );
    setRespondingTo(null);
    setResponseText("");
  };
  void handleRespond;
  void Send;
  void MessageCircle;
  void Textarea;

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
      {/* Privacy Notice */}
      <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Bot className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
                <h3 className="font-semibold text-foreground">{t.privacyProtected}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{t.privacyNote}</p>
              <div className="flex items-center gap-2 text-sm text-primary">
                <Clock className="h-4 w-4" strokeWidth={1.5} />
                {t.aggregatedOnly}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header + Expand/Collapse all */}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t.aiInsights}</h2>
            <p className="text-sm text-muted-foreground">{t.anonymizedAnalysis}</p>
          </div>
          {grouped.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
              className="cursor-pointer flex-shrink-0"
            >
              {allExpanded
                ? language === "en" ? "Collapse all" : "طي الكل"
                : language === "en" ? "Expand all" : "توسيع الكل"}
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm">
          <CardContent className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
              <div className="relative h-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  placeholder={t.searchInsights}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="cursor-pointer h-10">
                  <Filter className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  <SelectValue placeholder={t.allDepartments} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allDepartments}</SelectItem>
                  <SelectItem value="Accounting">Accounting</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
              <Select value={emotionFilter} onValueChange={setEmotionFilter}>
                <SelectTrigger className="cursor-pointer h-10">
                  <Filter className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  <SelectValue placeholder={t.allEmotions} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allEmotions}</SelectItem>
                  {emotions.map((emotion) => (
                    <SelectItem key={emotion.id} value={emotion.id}>
                      {language === "en" ? emotion.label : emotion.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="cursor-pointer">
                  <Calendar className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="day">This Day</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Active filter chips + Reset all */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {searchQuery !== "" && (
              <FilterChip
                label={`"${searchQuery}"`}
                onRemove={() => setSearchQuery("")}
              />
            )}
            {departmentFilter !== "all" && (
              <FilterChip
                label={`${language === "en" ? "Dept" : "القسم"}: ${departmentFilter}`}
                onRemove={() => setDepartmentFilter("all")}
              />
            )}
            {emotionFilter !== "all" && (
              <FilterChip
                label={emotionLabelForId(emotionFilter)}
                onRemove={() => setEmotionFilter("all")}
              />
            )}
            {timeFilter !== "all" && (
              <FilterChip
                label={timeLabelForValue(timeFilter)}
                onRemove={() => setTimeFilter("all")}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="ml-auto cursor-pointer text-sm h-7"
            >
              {language === "en" ? "Reset all" : "إعادة تعيين الكل"}
            </Button>
          </div>
        )}
      </div>

      {/* Summary strip */}
      {filteredInsights.length > 0 && (
        <Card className="border-0 shadow-sm bg-card/90 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {language === "en" ? "Messages" : "الرسائل"}
                  </div>
                  <div className="text-xl font-bold text-foreground tabular-nums">{summary.total}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {language === "en" ? "Employees" : "الموظفون"}
                  </div>
                  <div className="text-xl font-bold text-foreground tabular-nums">{totalEmployees}</div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  {language === "en" ? "Mood distribution" : "توزيع المشاعر"}
                </div>
                <div className="flex w-full h-3 rounded-full overflow-hidden bg-secondary">
                  {summary.total > 0 && (
                    <>
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${(summary.positive / summary.total) * 100}%` }}
                        title={`${language === "en" ? "Positive" : "إيجابي"}: ${summary.positive}`}
                      />
                      <div
                        className="bg-gray-400 h-full"
                        style={{ width: `${(summary.neutral / summary.total) * 100}%` }}
                        title={`${language === "en" ? "Neutral" : "محايد"}: ${summary.neutral}`}
                      />
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${(summary.negative / summary.total) * 100}%` }}
                        title={`${language === "en" ? "Negative" : "سلبي"}: ${summary.negative}`}
                      />
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    {language === "en" ? "Positive" : "إيجابي"} <span className="tabular-nums">{summary.positive}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                    {language === "en" ? "Neutral" : "محايد"} <span className="tabular-nums">{summary.neutral}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                    {language === "en" ? "Negative" : "سلبي"} <span className="tabular-nums">{summary.negative}</span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department-grouped list */}
      <div className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {language === "en"
              ? "No reflections yet — waiting for employee submissions."
              : "لا توجد انعكاسات بعد — في انتظار إرسالات الموظفين."}
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-muted-foreground text-center">
              {language === "en"
                ? "No messages match your filters."
                : "لا توجد رسائل مطابقة لعوامل التصفية."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={resetAllFilters}
              className="cursor-pointer"
            >
              {language === "en" ? "Clear filters" : "مسح عوامل التصفية"}
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            {grouped.map(([department, messages], idx) => {
              const expanded = expandedDepartments.has(department);
              const severity = departmentSeverity(messages);

              const emotionCounts = new Map<string, number>();
              let totalEmployees = 0;
              for (const m of messages) {
                emotionCounts.set(m.emotion, (emotionCounts.get(m.emotion) ?? 0) + 1);
                totalEmployees += m.employeeCount;
              }
              const sortedEmotions = Array.from(emotionCounts.entries()).sort(
                ([, a], [, b]) => b - a
              );

              return (
                <motion.div
                  key={department}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card
                    className={`border-0 shadow-md bg-card/90 backdrop-blur-sm overflow-hidden ${severityBorderClass(
                      severity
                    )}`}
                  >
                    {/* Header */}
                    <button
                      onClick={() => toggleDepartment(department)}
                      className="w-full text-left cursor-pointer hover:bg-secondary/30 transition-colors"
                      aria-expanded={expanded}
                    >
                      <div className="p-5 flex items-center gap-3 flex-wrap">
                        {expanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                        )}
                        <h3 className="font-semibold text-foreground text-base">
                          {department}
                        </h3>
                        <div className="flex items-center gap-2 ml-auto flex-wrap">
                          {sortedEmotions.map(([emotion, count]) => (
                            <span
                              key={emotion}
                              className="inline-flex items-center gap-1 text-sm bg-secondary/60 px-2 py-1 rounded-full"
                              title={emotion}
                            >
                              <span>{emotionEmojis[emotion] || "😐"}</span>
                              <span className="tabular-nums text-xs font-medium text-foreground">
                                {count}
                              </span>
                            </span>
                          ))}
                          <Badge variant="secondary" className="text-xs">
                            {messages.length} {language === "en" ? "msgs" : "رسائل"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {totalEmployees} {language === "en" ? "emp" : "موظف"}
                          </Badge>
                        </div>
                      </div>
                    </button>

                    {/* Body */}
                    {expanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-border/40">
                        {messages.map((insight, mIdx) => (
                          <div
                            key={insight.id}
                            className={`pt-4 ${mIdx > 0 ? "border-t border-border/30" : ""}`}
                          >
                            <div className="flex items-center gap-2 flex-wrap text-sm mb-3">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                              <span className="text-muted-foreground">{insight.date}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-lg leading-none">
                                {emotionEmojis[insight.emotion] || "😐"}
                              </span>
                              <span
                                className={`font-medium ${
                                  emotionColors[insight.emotion] ?? "text-foreground"
                                }`}
                              >
                                {insight.emotion}
                              </span>
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {insight.employeeCount}{" "}
                                {language === "en" ? "employees" : "موظفين"}
                              </Badge>
                            </div>
                            <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
                              <div className="flex items-center gap-2 mb-2">
                                <Bot className="h-4 w-4 text-primary" strokeWidth={1.5} />
                                <span className="text-sm font-medium text-foreground">
                                  {t.aiAnalysis}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{insight.aiAnalysis}</p>
                            </div>
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  {t.commonThemes}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {insight.themes.map((theme) => (
                                  <Badge key={theme} variant="outline" className="bg-card text-xs">
                                    {theme}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-foreground">
      <span className="max-w-[220px] truncate">{label}</span>
      <button
        onClick={onRemove}
        className="cursor-pointer hover:bg-primary/20 rounded-full p-0.5"
        aria-label="Remove filter"
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </span>
  );
}
