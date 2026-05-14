"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Lock,
  Clock,
  Search,
  Filter,
  MessageCircle,
  TrendingUp,
  Calendar,
  Users,
  X,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  emotions,
  useApp,
  translations,
  type FeedbackMessage,
} from "@/lib/app-context";

const mockInsights: FeedbackMessage[] = [
  {
    id: "1",
    department: "Accounting Department",
    emotion: "Stress / Anxiety",
    employeeCount: 3,
    date: "3/10/2026",
    themes: ["Workload Management", "Time Pressure", "Task Distribution"],
    aiAnalysis:
      "AI detected 3 employee(s) experiencing high stress levels. Common patterns include concerns about workload distribution, time management challenges, and need for better task prioritization.",
    responded: false,
    message: "",
  },
  {
    id: "2",
    department: "IT Department",
    emotion: "Happiness / Satisfaction",
    employeeCount: 4,
    date: "3/10/2026",
    themes: ["Team Collaboration", "Achievement", "Positive Environment"],
    aiAnalysis:
      "AI detected 4 employee(s) reporting high satisfaction. Positive feedback centers on successful teamwork, task completion, and supportive workplace culture.",
    responded: true,
    response:
      "Thank you for your positive feedback! We're glad the equipment upgrades are making a difference.",
    message: "",
  },
  {
    id: "3",
    department: "Maintenance Department",
    emotion: "Frustration / Anger",
    employeeCount: 2,
    date: "3/9/2026",
    themes: ["Equipment & Tools", "Process Improvement", "Support Needs"],
    aiAnalysis:
      "AI identified 2 employee(s) expressing frustration. Main concerns revolve around resource availability, process efficiency, and need for additional support.",
    responded: false,
    message: "",
  },
  {
    id: "4",
    department: "Sales Department",
    emotion: "Motivation / Excitement",
    employeeCount: 5,
    date: "3/8/2026",
    themes: ["Target Achievement", "Team Spirit", "Recognition"],
    aiAnalysis:
      "AI detected 5 employee(s) showing high motivation. Key themes include meeting sales targets, collaborative team dynamics, and feeling valued by management.",
    responded: true,
    response:
      "Congratulations on exceeding Q4 targets! Your dedication inspires the entire organization.",
    message: "",
  },
  {
    id: "5",
    department: "HR Department",
    emotion: "Calmness / Neutral",
    employeeCount: 2,
    date: "3/10/2026",
    themes: ["Work-Life Balance", "Flexible Schedule", "Employee Support"],
    aiAnalysis:
      "AI detected 2 employee(s) with neutral sentiment. Feedback suggests satisfaction with current work arrangements and support systems.",
    responded: false,
    message: "",
  },
  {
    id: "6",
    department: "Marketing Department",
    emotion: "Motivation / Excitement",
    employeeCount: 3,
    date: "3/10/2026",
    themes: ["Campaign Success", "Creative Freedom", "Team Recognition"],
    aiAnalysis:
      "AI detected 3 employee(s) expressing excitement about recent campaign launches and the creative opportunities within their roles.",
    responded: false,
    message: "",
  },
  {
    id: "7",
    department: "Sales Department",
    emotion: "Stress / Anxiety",
    employeeCount: 2,
    date: "3/9/2026",
    themes: ["Quota Pressure", "Customer Demands", "Time Management"],
    aiAnalysis:
      "AI detected 2 employee(s) experiencing stress related to sales quotas and customer demands. Employees report feeling pressure to meet monthly targets.",
    responded: false,
    message: "",
  },
  {
    id: "8",
    department: "IT Department",
    emotion: "Happiness / Satisfaction",
    employeeCount: 3,
    date: "3/8/2026",
    themes: ["Project Completion", "Problem Solving", "Team Support"],
    aiAnalysis:
      "AI detected 3 employee(s) expressing satisfaction with recent successful project completion and strong team collaboration.",
    responded: false,
    message: "",
  },
  {
    id: "9",
    department: "Maintenance Department",
    emotion: "Cooperation / Team Spirit",
    employeeCount: 4,
    date: "3/7/2026",
    themes: ["Teamwork", "Equipment Maintenance", "Process Efficiency"],
    aiAnalysis:
      "AI detected 4 employee(s) demonstrating strong cooperation and team spirit in recent maintenance initiatives.",
    responded: false,
    message: "",
  },
];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [emotionFilter, setEmotionFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [insights, setInsights] = useState(mockInsights);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

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
      case "day":
        return { start: today, end: tomorrow };
      case "week":
        return { start: startOfWeek, end: tomorrow };
      case "month":
        return { start: startOfMonth, end: tomorrow };
      default:
        return null;
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
        theme.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesDepartment =
      departmentFilter === "all" ||
      insight.department.includes(departmentFilter);
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
          : insight,
      ),
    );
    setRespondingTo(null);
    setResponseText("");
  };

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
                <h3 className="font-semibold text-foreground">
                  {t.privacyProtected}
                </h3>
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
          <p className="text-sm text-muted-foreground">
            {t.anonymizedAnalysis}
          </p>
        </div>

        <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm">
          <CardContent className="p-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-1">
              <div className="relative h-8">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <Input
                  placeholder={t.searchInsights}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-8"
                />
              </div>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="cursor-pointer h-10">
                  <Filter className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  <SelectValue placeholder={t.allDepartments} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    {t.allDepartments}
                  </SelectItem>
                  <SelectItem value="Accounting" className="cursor-pointer">
                    Accounting
                  </SelectItem>
                  <SelectItem value="IT" className="cursor-pointer">
                    IT
                  </SelectItem>
                  <SelectItem value="Maintenance" className="cursor-pointer">
                    Maintenance
                  </SelectItem>
                  <SelectItem value="Sales" className="cursor-pointer">
                    Sales
                  </SelectItem>
                  <SelectItem value="Marketing" className="cursor-pointer">
                    Marketing
                  </SelectItem>
                  <SelectItem value="HR" className="cursor-pointer">
                    HR
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={emotionFilter} onValueChange={setEmotionFilter}>
                <SelectTrigger className="cursor-pointer h-10">
                  <Filter className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  <SelectValue placeholder={t.allEmotions} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">
                    {t.allEmotions}
                  </SelectItem>
                  {emotions.map((emotion) => (
                    <SelectItem value={emotion.id} className="cursor-pointer">
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
                  <SelectItem value="all" className="cursor-pointer">
                    All Time
                  </SelectItem>
                  <SelectItem value="day" className="cursor-pointer">
                    This Day
                  </SelectItem>
                  <SelectItem value="week" className="cursor-pointer">
                    This Week
                  </SelectItem>
                  <SelectItem value="month" className="cursor-pointer">
                    This Month
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insight Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredInsights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                        {emotionEmojis[insight.emotion] || "😐"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {insight.department}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {insight.employeeCount}{" "}
                            {language === "en" ? "employees" : "موظفين"}
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
                    {/* {insight.responded && (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        {t.responded}
                      </Badge>
                    )} */}
                  </div>

                  {/* AI Analysis */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-4 w-4 text-primary" strokeWidth={1.5} />
                      <span className="text-sm font-medium text-foreground">
                        {t.aiAnalysis}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.aiAnalysis}
                    </p>
                  </div>

                  {/* Themes */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp
                        className="h-4 w-4 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                      <span className="text-sm font-medium text-muted-foreground">
                        {t.commonThemes}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {insight.themes.map((theme) => (
                        <Badge
                          key={theme}
                          variant="outline"
                          className="bg-card"
                        >
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* {insight.responded && insight.response ? (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="h-4 w-4 text-primary" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-primary">
                          {t.yourResponse}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        {insight.response}
                      </p>
                    </div>
                  ) : respondingTo === insight.id ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <Textarea
                        placeholder={language === "en" ? "Write your response to this insight cluster..." : "اكتب ردك على هذه المجموعة من الرؤى..."}
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRespond(insight.id)}
                          disabled={!responseText.trim()}
                          className="gap-2 cursor-pointer"
                        >
                          <Send className="h-4 w-4" strokeWidth={1.5} />
                          {language === "en" ? "Send Response" : "إرسال الرد"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setRespondingTo(null)
                            setResponseText("")
                          }}
                          className="cursor-pointer"
                        >
                          <X className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setRespondingTo(insight.id)}
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer hover:underline"
                    >
                      <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                      {t.respondToCluster}
                    </button>
                  )} */}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

