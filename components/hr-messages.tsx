"use client";

import { useEffect, useState } from "react";
import { fetchMessages, type MessageInsight } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Lock, Clock, Search, Filter,
  TrendingUp, Calendar, X, Send, MessageCircle,
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

export function HRMessages() {
  const { language } = useApp();
  const t = translations[language];

  const [searchQuery, setSearchQuery]           = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [emotionFilter, setEmotionFilter]       = useState("all");
  const [timeFilter, setTimeFilter]             = useState("all");
  const [insights, setInsights]                 = useState<MessageInsight[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [respondingTo, setRespondingTo]         = useState<string | null>(null);
  const [responseText, setResponseText]         = useState("");

  useEffect(() => {
    fetchMessages()
      .then(setInsights)
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

  const parseDate = (dateStr: string) => {
    const [month, day, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
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

      {/* Search & Filters */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t.aiInsights}</h2>
          <p className="text-sm text-muted-foreground">{t.anonymizedAnalysis}</p>
        </div>
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
      </div>

      {/* Insight Cards */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No insights yet — waiting for employee reflections.
          </div>
        ) : (
          <AnimatePresence>
            {filteredInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                          {emotionEmojis[insight.emotion] || "😐"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{insight.department}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {insight.employeeCount} {language === "en" ? "employees" : "موظفين"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" strokeWidth={1.5} />
                            {insight.date}
                            <span className="mx-1">•</span>
                            <span className={emotionColors[insight.emotion]}>
                              {insight.emotion}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-primary" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-foreground">{t.aiAnalysis}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.aiAnalysis}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-muted-foreground">{t.commonThemes}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {insight.themes.map((theme) => (
                          <Badge key={theme} variant="outline" className="bg-card">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
