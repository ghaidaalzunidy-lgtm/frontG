"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

export type UserRole = "employee" | "hr" | "admin" | null;
export type AppView = "home" | "login" | "register" | "employee-portal" | "hr-dashboard" | "admin-dashboard";
export type Language = "en" | "ar";
export type AuthMode = "login" | "signup";
export type UserType = "employee" | "hr" | "admin";

export interface User {
  name: string;
  email: string;
  department?: string;
  role: UserRole;
  position?: string;
  phone?: string;
  bio?: string;
}

export interface FeedbackMessage {
  id: string;
  department: string;
  emotion: string;
  message: string;
  date: string;
  employeeCount: number;
  themes: string[];
  aiAnalysis: string;
  responded: boolean;
  response?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  view: AppView;
  setView: (view: AppView) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  userType: UserType;
  setUserType: (type: UserType) => void;
  toasts: Toast[];
  addToast: (message: string, type: Toast["type"]) => void;
  removeToast: (id: string) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "moodloop_session";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [view, setView] = useState<AppView>("home");
  const [language, setLanguage] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [userType, setUserType] = useState<UserType>("employee");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session.user) {
          setUserState(session.user);
          const role = session.user.role;
          setView(
            role === "admin"
              ? "admin-dashboard"
              : role === "hr"
                ? "hr-dashboard"
                : "employee-portal",
          );
        }
        if (session.language) {
          setLanguage(session.language);
        }
      }
    } catch (e) {
      console.error("Failed to load session:", e);
    }
    setIsHydrated(true);
    setIsLoading(false);
  }, []);

  // Save session to localStorage when user or language changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, language }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save session:", e);
    }
  }, [user, language, isHydrated]);

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      setView(
        newUser.role === "admin"
          ? "admin-dashboard"
          : newUser.role === "hr"
            ? "hr-dashboard"
            : "employee-portal",
      );
    }
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUserState((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    setView("home");
    setAuthMode("login");
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        view,
        setView,
        language,
        setLanguage,
        isLoading,
        setIsLoading,
        authMode,
        setAuthMode,
        userType,
        setUserType,
        toasts,
        addToast,
        removeToast,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

// Custom hook for user management
export function useUser() {
  const { user, updateUser, addToast, language } = useApp();
  const t = translations[language];

  const saveProfile = useCallback(
    (updates: Partial<User>) => {
      updateUser(updates);
      addToast(
        language === "en"
          ? "Profile updated successfully"
          : "تم تحديث الملف الشخصي بنجاح",
        "success",
      );
    },
    [updateUser, addToast, language],
  );

  return { user, updateUser: saveProfile };
}

export const translations = {
  en: {
    // Auth
    login: "Login",
    signup: "Sign Up",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    loginToAccount: "Login to your account",
    createAccount: "Create Account",
    enterCredentials: "Enter your credentials to continue",
    // Landing/Home
    welcome: "Welcome to MoodLoop",
    tagline:
      "Transform your workplace culture with real-time employee well-being insights",
    getStarted: "Get Started",
    chooseRole: "Choose your role to continue",
    employeePortal: "Employee Portal",
    employeeDesc: "Share your daily emotions and feedback",
    hrPortal: "HR / Management Portal",
    hrDesc: "Monitor and respond to team feedback",
    dataSecure: "Your data is encrypted and secure",
    anonymous: "Anonymous feedback system",
    safeSpace: "Safe space for honest communication",
    realTimeAnalytics: "Real-time analytics",
    trackTrends: "Track trends and improvements",
    fosterTeam: "Foster team spirit",
    positiveEnv: "Build a positive work environment",
    back: "Back",
    fullName: "Full Name",
    email: "Email",
    password: "Password",
    department: "Department",
    infoSecure: "Your information is secure and encrypted",
    employeeReg: "Employee Registration",
    hrReg: "HR / Management Registration",
    createToStart: "Create your account to get started",
    logout: "Logout",
    howFeeling: "How are you feeling today?",
    selectEmotion: "Select an emotion that best describes your current state",
    selectEmotionFirst: "Please select an emotion first",
    shareThoughts: "Share your thoughts",
    writePlaceholder: "Write your message here (Arabic or English)...",
    submitFeedback: "Submit Feedback",
    anonymousNote:
      "Your submission is completely anonymous. Your department will be visible to HR for context, but your identity will remain confidential.",
    yourInfo: "Your Information",
    deptInfo:
      "This information helps HR understand department-specific trends while maintaining your anonymity.",
    thankYou: "Thank you for sharing!",
    feedbackSubmitted: "Your feedback has been submitted anonymously",
    aiResponse: "AI Response",
    dashboard: "Dashboard",
    messages: "Messages",
    profile: "Profile",
    analyticsDashboard: "Analytics Dashboard",
    overviewWellbeing: "Overview of employee well-being across departments",
    totalMessages: "Total Messages",
    avgMoodScore: "Avg Mood Score",
    departments: "Departments",
    issuesFlagged: "Issues Flagged",
    fromLastMonth: "from last month",
    improvement: "improvement",
    activeDepartments: "Active departments",
    needsAttention: "Needs attention",
    departmentComparison: "Department Comparison",
    monthlyTrends: "Monthly Trends",
    currentMoodDist: "Current Mood Distribution",
    yoyImprovement: "Year-over-Year Improvement",
    greatProgress:
      "Great progress! Overall workplace satisfaction has improved by 21% over the past two years.",
    privacyProtected: "Privacy-Protected AI Analysis",
    privacyNote:
      "Employee messages are analyzed by AI to detect common themes, patterns, and emotional trends. Individual messages remain completely anonymous and are never displayed in full to protect employee privacy.",
    aggregatedOnly:
      "Only aggregated insights and recommendations are shown below",
    aiInsights: "AI-Generated Insights",
    anonymizedAnalysis: "Anonymized analysis of employee feedback patterns",
    searchInsights: "Search insights...",
    allDepartments: "All Departments",
    allEmotions: "All Emotions",
    aiAnalysis: "AI Analysis",
    commonThemes: "Common Themes Detected:",
    respondToCluster: "Respond to this insight cluster",
    responded: "Responded",
    yourResponse: "Your Response",
    profileSettings: "Profile Settings",
    manageAccount: "Manage your account information",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    position: "Position",
    role: "Role",
    phoneNumber: "Phone Number",
    accountSettings: "Account Settings",
    emailNotifications: "Email Notifications",
    receiveAlerts: "Receive alerts for new employee messages",
    weeklyReports: "Weekly Reports",
    receiveWeekly: "Receive weekly analytics summaries",
    // Validation
    emailRequired: "Email is required",
    invalidEmail: "Please enter a valid email address",
    passwordRequired: "Password is required",
    nameRequired: "Name is required",
    departmentRequired: "Please select a department",
    // Admin
    adminPortal: "Admin Portal",
    adminDesc: "Manage users, configuration, and system health",
    adminReg: "Admin Sign-in",
    adminDashboard: "Admin Console",
    users: "Users",
    settings: "Settings",
    systemHealth: "System Health",
    activityLogs: "Activity Logs",
    exports: "Exports",
    model: "Model",
    backupRestore: "Backup & Restore",
    addDepartment: "Add Department",
    departmentName: "Department name",
    exportMessagesCsv: "Export messages (CSV)",
    exportMessagesDesc:
      "One row per submission with date, department, encrypted message (Fernet ciphertext — unreadable without the key), the employee-selected emotion, and the model's predicted emotion. No employee identifiers.",
    newUser: "New User",
    deactivate: "Deactivate",
    reactivate: "Reactivate",
    editUser: "Edit User",
    active: "Active",
    inactive: "Inactive",
    save: "Save",
    delete: "Delete",
    currentValue: "Current value",
    defaultValue: "Default",
    valueClamped: "Value was clamped to the allowed range.",
    confirmRestore: "Type RESTORE to confirm",
    downloadBackup: "Download backup",
    uploadModel: "Update Model",
    modelHubId: "Model Hub ID",
    uptime: "Uptime",
    diskUsage: "Disk usage",
    dbStatus: "Database",
    counts: "Row counts",
    loginFailures24h: "Login failures (24h)",
    // ── Department alarms (HR dashboard) ─────────────────────
    departmentAlarms:    "Department alarms",
    noActiveAlarms:      "No active department alarms",
    negativeLabel:       "negative",
    analysesLabel:       "analyses",
    last7Days:           "Last 7 days",
    severityLow:         "Low",
    severityMedium:      "Medium",
    severityHigh:        "High",
    severityCritical:    "Critical",
  },
  ar: {
    // Auth
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    dontHaveAccount: "ليس لديك حساب؟",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    loginToAccount: "تسجيل الدخول إلى حسابك",
    createAccount: "إنشاء حساب",
    enterCredentials: "أدخل بياناتك للمتابعة",
    // Landing/Home
    welcome: "مرحباً بك في MoodLoop",
    tagline: "حوّل ثقافة مكان عملك من خلال رؤى رفاهية الموظفين في الوقت الفعلي",
    getStarted: "ابدأ الآن",
    chooseRole: "اختر دورك للمتابعة",
    employeePortal: "بوابة الموظف",
    employeeDesc: "شارك مشاعرك وملاحظاتك اليومية",
    hrPortal: "بوابة الموارد البشرية / الإدارة",
    hrDesc: "راقب واستجب لملاحظات الفريق",
    dataSecure: "بياناتك مشفرة وآمنة",
    anonymous: "نظام ملاحظات مجهول الهوية",
    safeSpace: "مساحة آمنة للتواصل الصادق",
    realTimeAnalytics: "تحليلات في الوقت الفعلي",
    trackTrends: "تتبع الاتجاهات والتحسينات",
    fosterTeam: "تعزيز روح الفريق",
    positiveEnv: "بناء بيئة عمل إيجابية",
    back: "رجوع",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    department: "القسم",
    infoSecure: "معلوماتك آمنة ومشفرة",
    employeeReg: "تسجيل الموظف",
    hrReg: "تسجيل الموارد البشرية / الإدارة",
    createToStart: "أنشئ حسابك للبدء",
    logout: "تسجيل الخروج",
    howFeeling: "كيف تشعر اليوم؟",
    selectEmotion: "اختر المشاعر التي تصف حالتك الحالية بشكل أفضل",
    selectEmotionFirst: "يرجى اختيار مشاعر أولاً",
    shareThoughts: "شارك أفكارك",
    writePlaceholder: "اكتب رسالتك هنا (بالعربية أو الإنجليزية)...",
    submitFeedback: "إرسال الملاحظات",
    anonymousNote:
      "إرسالك مجهول الهوية تماماً. سيكون قسمك مرئياً للموارد البشرية للسياق، لكن هويتك ستبقى سرية.",
    yourInfo: "معلوماتك",
    deptInfo:
      "تساعد هذه المعلومات الموارد البشرية على فهم اتجاهات القسم مع الحفاظ على سريتك.",
    thankYou: "شكراً لمشاركتك!",
    feedbackSubmitted: "تم إرسال ملاحظاتك بشكل مجهول",
    aiResponse: "استجابة الذكاء الاصطناعي",
    dashboard: "لوحة التحكم",
    messages: "الرسائل",
    profile: "الملف الشخصي",
    analyticsDashboard: "لوحة التحليلات",
    overviewWellbeing: "نظرة عامة على رفاهية الموظفين عبر الأقسام",
    totalMessages: "إجمالي الرسائل",
    avgMoodScore: "متوسط درجة المزاج",
    departments: "الأقسام",
    issuesFlagged: "المشاكل المُبلَّغ عنها",
    fromLastMonth: "من الشهر الماضي",
    improvement: "تحسن",
    activeDepartments: "أقسام نشطة",
    needsAttention: "تحتاج انتباه",
    departmentComparison: "مقارنة الأقسام",
    monthlyTrends: "الاتجاهات الشهرية",
    currentMoodDist: "توزيع المزاج الحالي",
    yoyImprovement: "التحسن السنوي",
    greatProgress:
      "تقدم رائع! تحسن الرضا العام في مكان العمل بنسبة 21٪ خلال العامين الماضيين.",
    privacyProtected: "تحليل AI محمي الخصوصية",
    privacyNote:
      "يتم تحليل رسائل الموظفين بواسطة الذكاء الاصطناعي للكشف عن الموضوعات والأنماط والاتجاهات العاطفية الشائعة. تظل الرسائل الفردية مجهولة تماماً ولا يتم عرضها بالكامل لحماية خصوصية الموظف.",
    aggregatedOnly: "يتم عرض الرؤى والتوصيات المجمعة فقط أدناه",
    aiInsights: "رؤى الذكاء الاصطناعي",
    anonymizedAnalysis: "تحليل مجهول الهوية لأنماط ملاحظات الموظفين",
    searchInsights: "البحث في الرؤى...",
    allDepartments: "جميع الأقسام",
    allEmotions: "جميع المشاعر",
    aiAnalysis: "تحليل AI",
    commonThemes: "الموضوعات الشائعة المكتشفة:",
    respondToCluster: "الرد على هذه المجموعة من الرؤى",
    responded: "تم الرد",
    yourResponse: "ردك",
    profileSettings: "إعدادات الملف الشخصي",
    manageAccount: "إدارة معلومات حسابك",
    editProfile: "تعديل الملف الشخصي",
    saveChanges: "حفظ التغييرات",
    cancel: "إلغاء",
    position: "المنصب",
    role: "الدور",
    phoneNumber: "رقم الهاتف",
    accountSettings: "إعدادات الحساب",
    emailNotifications: "إشعارات البريد الإلكتروني",
    receiveAlerts: "تلقي تنبيهات للرسائل الجديدة من الموظفين",
    weeklyReports: "التقارير الأسبوعية",
    receiveWeekly: "تلقي ملخصات تحليلية أسبوعية",
    // Validation
    emailRequired: "البريد الإلكتروني مطلوب",
    invalidEmail: "يرجى إدخال بريد إلكتروني صالح",
    passwordRequired: "كلمة المرور مطلوبة",
    nameRequired: "الاسم مطلوب",
    departmentRequired: "يرجى اختيار القسم",
    // Admin
    adminPortal: "بوابة المسؤول",
    adminDesc: "إدارة المستخدمين وإعدادات النظام والصحة العامة",
    adminReg: "تسجيل دخول المسؤول",
    adminDashboard: "لوحة المسؤول",
    users: "المستخدمون",
    settings: "الإعدادات",
    systemHealth: "صحة النظام",
    activityLogs: "سجل النشاط",
    exports: "التصدير",
    model: "النموذج",
    backupRestore: "النسخ الاحتياطي والاستعادة",
    addDepartment: "إضافة قسم",
    departmentName: "اسم القسم",
    exportMessagesCsv: "تصدير الرسائل (CSV)",
    exportMessagesDesc:
      "صف لكل مشاركة يحتوي على التاريخ والقسم والرسالة المشفرة (نص Fernet لا يمكن قراءته بدون المفتاح) والمشاعر التي اختارها الموظف وتوقع النموذج. بدون أي معرّفات للموظفين.",
    newUser: "مستخدم جديد",
    deactivate: "إلغاء التفعيل",
    reactivate: "إعادة التفعيل",
    editUser: "تعديل المستخدم",
    active: "نشط",
    inactive: "غير نشط",
    save: "حفظ",
    delete: "حذف",
    currentValue: "القيمة الحالية",
    defaultValue: "القيمة الافتراضية",
    valueClamped: "تم تقييد القيمة ضمن النطاق المسموح.",
    confirmRestore: "اكتب RESTORE للتأكيد",
    downloadBackup: "تنزيل نسخة احتياطية",
    uploadModel: "تحديث النموذج",
    modelHubId: "معرّف النموذج",
    uptime: "وقت التشغيل",
    diskUsage: "استخدام القرص",
    dbStatus: "قاعدة البيانات",
    counts: "إحصاءات الصفوف",
    loginFailures24h: "محاولات الدخول الفاشلة (24س)",
    // ── تنبيهات الأقسام (لوحة الموارد البشرية) ─────────────────────
    departmentAlarms:    "تنبيهات الأقسام",
    noActiveAlarms:      "لا توجد تنبيهات نشطة",
    negativeLabel:       "سلبي",
    analysesLabel:       "تحليل",
    last7Days:           "آخر 7 أيام",
    severityLow:         "منخفض",
    severityMedium:      "متوسط",
    severityHigh:        "مرتفع",
    severityCritical:    "حرج",
  },
};

export const departments = [
  "Accounting Department",
  "Maintenance Department",
  "Human Resources",
  "IT Department",
  "Sales Department",
  "Marketing Department",
];

export const emotions = [
  {
    id: "happiness",
    label: "Happiness / Satisfaction",
    labelAr: "السعادة / الرضا",
    emoji: "😊",
    color: "#22c55e",
  },
  {
    id: "motivation",
    label: "Motivation / Excitement",
    labelAr: "التحفيز / الحماس",
    emoji: "🤩",
    color: "#f97316",
  },
  {
    id: "cooperation",
    label: "Cooperation / Team Spirit",
    labelAr: "التعاون / روح الفريق",
    emoji: "🤝",
    color: "#eab308",
  },
  {
    id: "calmness",
    label: "Calmness / Neutral",
    labelAr: "الهدوء / محايد",
    emoji: "😐",
    color: "#6b7280",
  },
  {
    id: "stress",
    label: "Stress / Anxiety",
    labelAr: "التوتر / القلق",
    emoji: "😣",
    color: "#ef4444",
  },
  {
    id: "frustration",
    label: "Frustration / Anger",
    labelAr: "الإحباط / الغضب",
    emoji: "😠",
    color: "#dc2626",
  },
  {
    id: "sadness",
    label: "Sadness / Burnout",
    labelAr: "الحزن / الإرهاق",
    emoji: "😢",
    color: "#3b82f6",
  },
];
