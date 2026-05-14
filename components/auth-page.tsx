"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Building2,
  Lock,
  Languages,
  ArrowRight,
  ArrowLeft,
  Smile,
  BarChart3,
  Heart,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, translations, departments } from "@/lib/app-context";
import { useCursorGlow } from "@/hooks/use-cursor-glow";
import { ThemeToggle } from "@/components/theme-toggle";
import { ContactUs } from "@/components/contact-us";
import { FloatingContactButton } from "@/components/floating-contact-button";
import { useTheme } from "next-themes";
import Image from "next/image";

const features = [
  { icon: Smile, titleKey: "anonymous", descKey: "safeSpace" },
  { icon: BarChart3, titleKey: "realTimeAnalytics", descKey: "trackTrends" },
  { icon: Heart, titleKey: "fosterTeam", descKey: "positiveEnv" },
];

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  department?: string;
}

interface AuthError {
  type: "incorrect_password" | "email_not_registered" | "general" | null;
  message: string;
}

// Simulated database of registered emails and their passwords
const registeredUsers: Record<string, { password: string; name: string }> = {
  "employee@company.com": { password: "SecurePass@123", name: "John Doe" },
  "hr@company.com": { password: "SecurePass@123", name: "Jane Smith" },
  "test@example.com": { password: "TestPass@123", name: "Test User" },
};

export function AuthPage() {
  const {
    setUser,
    language,
    setLanguage,
    authMode,
    setAuthMode,
    userType,
    setUserType,
    addToast,
    setView,
  } = useApp();
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const t = translations[language];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState<AuthError>({ type: null, message: "" });
  const [shakeFields, setShakeFields] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"email" | "reset-code" | "new-password" | "success">("email");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  // Start directly at form if userType is already selected from home page, otherwise show role selection
  const [step, setStep] = useState<"select-role" | "form">(userType ? "form" : "select-role");

  // Password validation state
  interface PasswordStrength {
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  }
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // Check password strength in real-time
  const checkPasswordStrength = (pwd: string): PasswordStrength => {
    return {
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[@#$%^&*!_\-+=\[\]{};:'",.<>?/\\|`~]/.test(pwd),
    };
  };

  // Generate strong password
  const generateStrongPassword = (): string => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "@#$%^&*!";

    let pwd = "";
    pwd += uppercase[Math.floor(Math.random() * uppercase.length)];
    pwd += lowercase[Math.floor(Math.random() * lowercase.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += special[Math.floor(Math.random() * special.length)];

    // Add 8 more random characters from all available characters
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = 0; i < 8; i++) {
      pwd += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Authentication error handler
  const validateLoginCredentials = (email: string, pwd: string): AuthError => {
    // Check if email exists
    if (!registeredUsers[email]) {
      return {
        type: "email_not_registered",
        message: language === "en"
          ? "This email is not registered. Please check or sign up."
          : "هذا البريد الإلكتروني غير مسجل. يرجى التحقق أو التسجيل."
      };
    }

    // Check if password is correct
    if (registeredUsers[email].password !== pwd) {
      return {
        type: "incorrect_password",
        message: language === "en"
          ? "Invalid password. Please try again."
          : "كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى."
      };
    }

    return { type: null, message: "" };
  };

  // Dynamic gradient based on theme
  const gradientStyle =
    currentTheme === "dark"
      ? "linear-gradient(-45deg, #614EA9, #3d3a5a, #2C2A4A, #4a477a, #5d4fa9)"
      : "linear-gradient(-45deg, #C3B4FF, #D4CCFF, #E8EAF6, #EDE9FF, #B8AEEE)";

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  const validateEmail = (email: string): boolean => {
    // Check if email contains '@' symbol
    if (!email.includes("@")) {
      return false;
    }
    
    // Check if email contains valid domain extension (including .com, .org, .net, etc.)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const triggerShake = (fields: string[]) => {
    setShakeFields(fields);
    setTimeout(() => setShakeFields([]), 500);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const invalidFields: string[] = [];

    if (authMode === "signup" && !name.trim()) {
      newErrors.name = t.nameRequired;
      invalidFields.push("name");
    }

    if (!email.trim()) {
      newErrors.email = t.emailRequired;
      invalidFields.push("email");
    } else if (!validateEmail(email)) {
      newErrors.email = t.invalidEmail;
      invalidFields.push("email");
    }

    if (!password.trim()) {
      newErrors.password = t.passwordRequired;
      invalidFields.push("password");
    } else if (authMode === "signup") {
      // For signup, enforce strong password requirements
      if (!passwordStrength.hasUppercase || !passwordStrength.hasLowercase || !passwordStrength.hasNumber || !passwordStrength.hasSpecial) {
        newErrors.password = language === "en"
          ? "Password must contain uppercase, lowercase, number, and special character"
          : "يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة ورقم وحرف خاص";
        invalidFields.push("password");
      }
    }

    if (authMode === "signup" && userType === "employee" && !department) {
      newErrors.department = t.departmentRequired;
      invalidFields.push("department");
    }

    setErrors(newErrors);

    if (invalidFields.length > 0) {
      triggerShake(invalidFields);
      addToast(Object.values(newErrors)[0], "error");
      return false;
    }

    return true;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError({ type: null, message: "" });

    if (!validateForm()) return;

    if (authMode === "login") {
      const credentialError = validateLoginCredentials(email, password);
      if (credentialError.type) {
        setAuthError(credentialError);
        triggerShake(["email", "password"]);
        addToast(credentialError.message, "error");
        return;
      }
    }

    if (authMode === "signup") {
      setView("verify-email");
      return;
    }

    if (userType === "employee") {
      setUser({
        name: registeredUsers[email]?.name || email.split("@")[0],
        email,
        department,
        role: "employee",
      });
    } else {
      setUser({
        name: registeredUsers[email]?.name || email.split("@")[0],
        email,
        role: "hr",
        position: "HR Manager",
        phone: "+1 (555) 123-4567",
        bio: "Dedicated HR professional focused on creating a positive and supportive work environment for all employees.",
      });
    }
  };
  const shakeAnimation = {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  };

  // Forgot Password Handlers
  const handleSendResetLink = () => {
    if (!forgotPasswordEmail.trim()) {
      addToast(
        language === "en" ? "Please enter your email" : "يرجى إدخال بريدك الإلكتروني",
        "error"
      );
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      addToast(
        language === "en" ? "Please enter a valid email" : "يرجى إدخال بريد إلكتروني صحيح",
        "error"
      );
      return;
    }

    if (!registeredUsers[forgotPasswordEmail]) {
      addToast(
        language === "en"
          ? "This email is not registered"
          : "هذا البريد الإلكتروني غير مسجل",
        "error"
      );
      return;
    }

    // Simulate sending reset link
    addToast(
      language === "en"
        ? "Reset link sent! Check your email."
        : "تم إرسال رابط إعادة التعيين! تحقق من بريدك الإلكتروني.",
      "success"
    );
    setForgotPasswordStep("reset-code");
  };

  const handleVerifyResetCode = () => {
    if (!resetCode.trim()) {
      addToast(
        language === "en" ? "Please enter the reset code" : "يرجى إدخال رمز إعادة التعيين",
        "error"
      );
      return;
    }

    // Simulate code verification (in real app, validate against backend)
    addToast(
      language === "en" ? "Code verified!" : "تم التحقق من الرمز!",
      "success"
    );
    setForgotPasswordStep("new-password");
  };

  const handleResetPassword = () => {
    if (!newPassword.trim() || !newPasswordConfirm.trim()) {
      addToast(
        language === "en"
          ? "Please enter new password"
          : "يرجى إدخال كلمة مرور جديدة",
        "error"
      );
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      addToast(
        language === "en"
          ? "Passwords do not match"
          : "كلمات المرور غير متطابقة",
        "error"
      );
      return;
    }

    if (newPassword.length < 8) {
      addToast(
        language === "en"
          ? "Password must be at least 8 characters"
          : "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل",
        "error"
      );
      return;
    }

    // Simulate password update
    addToast(
      language === "en"
        ? "Your password has been successfully updated!"
        : "تم تحديث كلمة المرور بنجاح!",
      "success"
    );
    setForgotPasswordStep("success");
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep("email");
    setForgotPasswordEmail("");
    setResetCode("");
    setNewPassword("");
    setNewPasswordConfirm("");
  };

  const { glowBg, handleMouseMove } = useCursorGlow();

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      dir={language === "ar" ? "rtl" : "ltr"}
      onMouseMove={handleMouseMove}
      style={{
        background: gradientStyle,
        backgroundSize: "400% 400%",
        animation: "gradient-shift 18s ease infinite",
      }}
    >
      {/* Cursor-tracked radial glow */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{ background: glowBg }}
      />

      {/* Navigation Bar - Fixed positioning */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 flex items-center"
      >
        {/* Left side - Back button */}
        <motion.button
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView("home")}
          className="flex items-center gap-2 text-sm md:text-base text-[#614EA9] hover:text-[#2C2A4A] transition-colors cursor-pointer font-medium px-3 py-2 rounded-lg hover:bg-secondary/50 flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          {language === "en" ? "Back" : "العودة"}
        </motion.button>

        {/* Spacer to push controls to the far right */}
        <div className="flex-1" />

        {/* Right side - Controls */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <ThemeToggle variant="inline" />
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 bg-card/80 backdrop-blur-sm cursor-pointer hover:border-primary/50 transition-all text-xs md:text-sm whitespace-nowrap"
          >
            <Languages className="h-4 w-4" strokeWidth={1.5} />
            {language === "en" ? "العربية" : "English"}
          </Button>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8 md:py-0 relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-xl">
          {/* Login Card */}
          <Card className="border-0 shadow-xl bg-card/90 backdrop-blur-sm">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <Image
                  src="/assets/logo.png"
                  alt="MoodLoop"
                  width={140}
                  height={36}
                  className="object-contain mx-auto"
                />
                <h2 className="text-xl font-semibold text-foreground mt-4">
                  {step === "select-role"
                    ? t.getStarted
                    : authMode === "login"
                      ? t.loginToAccount
                      : t.getStarted}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {step === "select-role"
                    ? t.chooseRole
                    : authMode === "login"
                      ? t.enterCredentials
                      : t.chooseRole}
                </p>
              </div>

              {/* Step-based content */}
              <AnimatePresence mode="wait">
                {step === "select-role" ? (
                  <motion.div
                    key="select-role"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setUserType("employee");
                        setStep("form");
                      }}
                      className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-all group text-left flex items-center gap-4 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                        <Users
                          className="h-6 w-6 text-primary"
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {t.employeePortal}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t.employeeDesc}
                        </p>
                      </div>
                      <ArrowRight
                        className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"
                        strokeWidth={1.5}
                      />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setUserType("hr");
                        setStep("form");
                      }}
                      className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-all group text-left flex items-center gap-4 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2
                          className="h-6 w-6 text-primary"
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {t.hrPortal}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t.hrDesc}
                        </p>
                      </div>
                      <ArrowRight
                        className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"
                        strokeWidth={1.5}
                      />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* Back button */}
                    <button
                      onClick={() => {
                        setStep("select-role");
                        setErrors({});
                      }}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      <ArrowRight
                        className="h-4 w-4 rotate-180"
                        strokeWidth={1.5}
                      />
                      {language === "en" ? "Change role" : "تغيير الدور"}
                    </button>

                    {/* Auth Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <AnimatePresence mode="wait">
                        {authMode === "signup" && (
                          <motion.div
                            key="name-field"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <Label htmlFor="name">{t.fullName}</Label>
                            <motion.div
                              animate={
                                shakeFields.includes("name")
                                  ? shakeAnimation
                                  : {}
                              }
                            >
                              <Input
                                id="name"
                                placeholder={
                                  language === "en"
                                    ? "Enter your name"
                                    : "أدخل اسمك"
                                }
                                value={name}
                                onChange={(e) => {
                                  setName(e.target.value);
                                  if (errors.name)
                                    setErrors({ ...errors, name: undefined });
                                }}
                                className={
                                  errors.name
                                    ? "border-[#FF4D4D] focus-visible:ring-[#FF4D4D]"
                                    : ""
                                }
                              />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-2">
                        <Label htmlFor="email">{t.email}</Label>
                        <motion.div
                          animate={
                            shakeFields.includes("email")
                              ? shakeAnimation
                              : {}
                          }
                        >
                          <Input
                            id="email"
                            type="email"
                            placeholder="your.email@company.com"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (errors.email)
                                setErrors({ ...errors, email: undefined });
                              if (authError.type)
                                setAuthError({ type: null, message: "" });
                            }}
                            className={
                              errors.email || authError.type === "email_not_registered"
                                ? "border-[#FF4D4D] focus-visible:ring-[#FF4D4D]"
                                : ""
                            }
                          />
                        </motion.div>
                        {(errors.email || authError.type === "email_not_registered") && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-[#FF4D4D] font-medium"
                          >
                            {authError.type === "email_not_registered"
                              ? authError.message
                              : errors.email}
                          </motion.p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">{t.password}</Label>
                          {authMode === "login" && (
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-xs font-medium text-[#614EA9] hover:text-[#7B5FB2] transition-colors cursor-pointer hover:underline"
                            >
                              {language === "en" ? "Forgot Password?" : "هل نسيت كلمة المرور؟"}
                            </button>
                          )}
                          {authMode === "signup" && (
                            <button
                              type="button"
                              onClick={() => {
                                const strongPwd = generateStrongPassword();
                                setPassword(strongPwd);
                                setPasswordStrength(checkPasswordStrength(strongPwd));
                              }}
                              className="text-xs px-2 py-1 rounded text-[#614EA9] hover:bg-secondary/50 transition-colors cursor-pointer"
                            >
                              💡 {language === "en" ? "Suggest Strong" : "اقتراح قوي"}
                            </button>
                          )}
                        </div>
                        <motion.div
                          animate={
                            shakeFields.includes("password")
                              ? shakeAnimation
                              : {}
                          }
                          className="relative"
                        >
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder={
                              language === "en"
                                ? "Enter your password"
                                : "أدخل كلمة المرور"
                            }
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setPasswordStrength(checkPasswordStrength(e.target.value));
                              if (errors.password)
                                setErrors({ ...errors, password: undefined });
                              if (authError.type)
                                setAuthError({ type: null, message: "" });
                            }}
                            className={`${errors.password || authError.type === "incorrect_password"
                                ? "border-[#FF4D4D] focus-visible:ring-[#FF4D4D]"
                                : ""
                              } pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#614EA9] hover:text-[#2C2A4A] dark:hover:text-[#8B7BC9] transition-colors cursor-pointer"
                            title={showPassword ? (language === "en" ? "Hide password" : "إخفاء كلمة المرور") : (language === "en" ? "Show password" : "عرض كلمة المرور")}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" strokeWidth={1.5} />
                            ) : (
                              <Eye className="h-5 w-5" strokeWidth={1.5} />
                            )}
                          </button>
                        </motion.div>
                        {(errors.password || authError.type === "incorrect_password") && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-[#FF4D4D] font-medium"
                          >
                            {authError.type === "incorrect_password"
                              ? authError.message
                              : errors.password}
                          </motion.p>
                        )}

                        {/* Password Strength Checklist - Show during signup */}
                        {authMode === "signup" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 p-3 bg-secondary/30 rounded-lg space-y-2"
                          >
                            <p className="text-xs font-semibold text-muted-foreground">
                              {language === "en" ? "Password Requirements:" : "متطلبات كلمة المرور:"}
                            </p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`w-4 h-4 rounded flex items-center justify-center ${passwordStrength.hasUppercase ? "bg-green-500/80" : "bg-gray-300/40"}`}>
                                  {passwordStrength.hasUppercase && <span className="text-white text-xs">✓</span>}
                                </span>
                                <span className={passwordStrength.hasUppercase ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                                  {language === "en" ? "Uppercase letter (A-Z)" : "حرف كبير (A-Z)"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`w-4 h-4 rounded flex items-center justify-center ${passwordStrength.hasLowercase ? "bg-green-500/80" : "bg-gray-300/40"}`}>
                                  {passwordStrength.hasLowercase && <span className="text-white text-xs">✓</span>}
                                </span>
                                <span className={passwordStrength.hasLowercase ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                                  {language === "en" ? "Lowercase letter (a-z)" : "حرف صغير (a-z)"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`w-4 h-4 rounded flex items-center justify-center ${passwordStrength.hasNumber ? "bg-green-500/80" : "bg-gray-300/40"}`}>
                                  {passwordStrength.hasNumber && <span className="text-white text-xs">✓</span>}
                                </span>
                                <span className={passwordStrength.hasNumber ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                                  {language === "en" ? "Number (0-9)" : "رقم (0-9)"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`w-4 h-4 rounded flex items-center justify-center ${passwordStrength.hasSpecial ? "bg-green-500/80" : "bg-gray-300/40"}`}>
                                  {passwordStrength.hasSpecial && <span className="text-white text-xs">✓</span>}
                                </span>
                                <span className={passwordStrength.hasSpecial ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                                  {language === "en" ? "Special character (@, #, $, %, etc.)" : "حرف خاص (@, #, $, %, إلخ)"}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <AnimatePresence mode="wait">
                        {authMode === "signup" && userType === "employee" && (
                          <motion.div
                            key="department-field"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <Label htmlFor="department">{t.department}</Label>
                            <motion.div
                              animate={
                                shakeFields.includes("department")
                                  ? shakeAnimation
                                  : {}
                              }
                            >
                              <Select
                                value={department}
                                onValueChange={(val) => {
                                  setDepartment(val);
                                  if (errors.department)
                                    setErrors({
                                      ...errors,
                                      department: undefined,
                                    });
                                }}
                              >
                                <SelectTrigger
                                  className={
                                    errors.department
                                      ? "border-[#FF4D4D]"
                                      : ""
                                  }
                                >
                                  <SelectValue
                                    placeholder={
                                      language === "en"
                                        ? "Select department"
                                        : "اختر القسم"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem
                                      key={dept}
                                      value={dept}
                                      className="cursor-pointer"
                                    >
                                      {dept}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold cursor-pointer"
                      >
                        {authMode === "login" ? t.login : t.createAccount}
                      </Button>
                    </form>

                    {/* Toggle Auth Mode */}
                    <div className="text-center">
                      <button
                        onClick={() => {
                          setAuthMode(
                            authMode === "login" ? "signup" : "login",
                          );
                          setErrors({});
                        }}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer hover:underline"
                      >
                        {authMode === "login"
                          ? t.dontHaveAccount
                          : t.alreadyHaveAccount}{" "}
                        <span className="text-primary font-medium">
                          {authMode === "login" ? t.signup : t.login}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Lock
                    className="h-4 w-4 text-amber-500"
                    strokeWidth={1.5}
                  />
                  {t.dataSecure}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Us Section */}
      <ContactUs />

      {/* Floating Contact Button */}
      <FloatingContactButton />

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForgotPassword}
              className="fixed inset-0 bg-black/40 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
                <CardContent className="p-8 space-y-6">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">
                      {forgotPasswordStep === "success"
                        ? language === "en"
                          ? "Password Updated!"
                          : "تم تحديث كلمة المرور!"
                        : language === "en"
                          ? "Reset Your Password"
                          : "إعادة تعيين كلمة المرور"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {forgotPasswordStep === "email" &&
                        (language === "en"
                          ? "Enter your email to receive a reset link"
                          : "أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين")}
                      {forgotPasswordStep === "reset-code" &&
                        (language === "en"
                          ? "Enter the code sent to your email"
                          : "أدخل الرمز المرسل إلى بريدك الإلكتروني")}
                      {forgotPasswordStep === "new-password" &&
                        (language === "en"
                          ? "Create your new password"
                          : "أنشئ كلمة مرور جديدة")}
                      {forgotPasswordStep === "success" &&
                        (language === "en"
                          ? "Your password has been successfully updated!"
                          : "تم تحديث كلمة المرور بنجاح!")}
                    </p>
                  </div>

                  {/* Email Step */}
                  {forgotPasswordStep === "email" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">
                          {language === "en" ? "Email Address" : "عنوان البريد الإلكتروني"}
                        </Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="your.email@company.com"
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          className="focus-visible:ring-[#614EA9]"
                        />
                      </div>
                      <Button
                        onClick={handleSendResetLink}
                        className="w-full bg-[#614EA9] hover:bg-[#7B5FB2] text-white"
                      >
                        {language === "en"
                          ? "Send Reset Link"
                          : "إرسال رابط إعادة التعيين"}
                      </Button>
                    </motion.div>
                  )}

                  {/* Reset Code Step */}
                  {forgotPasswordStep === "reset-code" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="reset-code">
                          {language === "en" ? "Reset Code" : "رمز إعادة التعيين"}
                        </Label>
                        <Input
                          id="reset-code"
                          type="text"
                          placeholder={language === "en" ? "Enter 6-digit code" : "أدخل رمز من 6 أرقام"}
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          maxLength={6}
                          className="text-center text-lg tracking-widest focus-visible:ring-[#614EA9]"
                        />
                      </div>
                      <Button
                        onClick={handleVerifyResetCode}
                        className="w-full bg-[#614EA9] hover:bg-[#7B5FB2] text-white"
                      >
                        {language === "en" ? "Verify Code" : "التحقق من الرمز"}
                      </Button>
                    </motion.div>
                  )}

                  {/* New Password Step */}
                  {forgotPasswordStep === "new-password" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="new-password">
                          {language === "en"
                            ? "New Password"
                            : "كلمة المرور الجديدة"}
                        </Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder={language === "en" ? "Enter new password" : "أدخل كلمة مرور جديدة"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="focus-visible:ring-[#614EA9]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">
                          {language === "en"
                            ? "Confirm Password"
                            : "تأكيد كلمة المرور"}
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder={language === "en" ? "Confirm password" : "تأكيد كلمة المرور"}
                          value={newPasswordConfirm}
                          onChange={(e) => setNewPasswordConfirm(e.target.value)}
                          className="focus-visible:ring-[#614EA9]"
                        />
                      </div>

                      <Button
                        onClick={handleResetPassword}
                        className="w-full bg-[#614EA9] hover:bg-[#7B5FB2] text-white"
                      >
                        {language === "en"
                          ? "Update Password"
                          : "تحديث كلمة المرور"}
                      </Button>
                    </motion.div>
                  )}

                  {/* Success Step */}
                  {forgotPasswordStep === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 text-center"
                    >
                      <div className="flex justify-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", duration: 0.5 }}
                          className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                        >
                          <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </motion.div>
                      </div>
                      <Button
                        onClick={resetForgotPassword}
                        className="w-full bg-[#614EA9] hover:bg-[#7B5FB2] text-white"
                      >
                        {language === "en"
                          ? "Back to Login"
                          : "العودة إلى تسجيل الدخول"}
                      </Button>
                    </motion.div>
                  )}

                  {/* Close Button */}
                  {forgotPasswordStep !== "success" && (
                    <button
                      onClick={resetForgotPassword}
                      className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      {language === "en" ? "Cancel" : "إلغاء"}
                    </button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
