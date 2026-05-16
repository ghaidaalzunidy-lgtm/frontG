"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Check, Lock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCursorGlow } from "@/hooks/use-cursor-glow";
import { resetPassword } from "@/lib/api";

type Lang = "en" | "ar";

// Inner component is wrapped in <Suspense> because useSearchParams()
// needs a suspense boundary during static rendering (Next.js 14+).
function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { theme, resolvedTheme } = useTheme();
  const { glowBg, handleMouseMove } = useCursorGlow();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<Lang>("en");

  useEffect(() => {
    setMounted(true);
    // Read the user's last-chosen language from localStorage (same key the
    // app context uses). Falls back to English if not set.
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("language");
      if (stored === "ar" || stored === "en") setLanguage(stored);
    }
  }, []);

  // If the page is opened without a token, fail fast — the link is malformed.
  const hasToken = token.length > 0;

  // Auto-redirect to login after a successful reset
  useEffect(() => {
    if (!isSuccess) return;
    const t = setTimeout(() => router.push("/"), 3000);
    return () => clearTimeout(t);
  }, [isSuccess, router]);

  // All translatable strings in one place
  const t = {
    invalidTitle: language === "en" ? "Invalid Link" : "رابط غير صالح",
    invalidBody: language === "en"
      ? "This password reset link is missing or malformed. Please request a new one from the login page."
      : "رابط إعادة تعيين كلمة المرور هذا مفقود أو غير صالح. يرجى طلب رابط جديد من صفحة تسجيل الدخول.",
    backToLogin: language === "en" ? "Back to Login" : "العودة إلى تسجيل الدخول",
    successTitle: language === "en" ? "Password Reset" : "تم إعادة تعيين كلمة المرور",
    successBody: language === "en"
      ? "Your password has been updated. Redirecting to login…"
      : "تم تحديث كلمة المرور الخاصة بك. جارٍ تحويلك إلى تسجيل الدخول…",
    goToLogin: language === "en" ? "Go to Login" : "الذهاب إلى تسجيل الدخول",
    formTitle: language === "en" ? "Reset Your Password" : "إعادة تعيين كلمة المرور",
    formBody: language === "en"
      ? "Choose a new password for your account."
      : "اختر كلمة مرور جديدة لحسابك.",
    newPasswordLabel: language === "en" ? "New Password" : "كلمة المرور الجديدة",
    newPasswordPlaceholder: language === "en" ? "At least 8 characters" : "8 أحرف على الأقل",
    confirmPasswordLabel: language === "en" ? "Confirm Password" : "تأكيد كلمة المرور",
    confirmPasswordPlaceholder: language === "en"
      ? "Re-enter the password"
      : "أعد إدخال كلمة المرور",
    tooShortError: language === "en"
      ? "Password must be at least 8 characters"
      : "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
    mismatchError: language === "en"
      ? "Passwords do not match"
      : "كلمتا المرور غير متطابقتين",
    genericError: language === "en"
      ? "Could not reset password"
      : "تعذر إعادة تعيين كلمة المرور",
    updatingButton: language === "en" ? "Updating..." : "جارٍ التحديث...",
    updateButton: language === "en" ? "Update Password" : "تحديث كلمة المرور",
    cancelButton: language === "en" ? "Cancel" : "إلغاء",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(t.tooShortError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.mismatchError);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mirror the auth page's animated diagonal gradient (light/dark variants)
  const currentTheme = mounted ? (resolvedTheme ?? theme) : "light";
  const gradientStyle =
    currentTheme === "dark"
      ? "linear-gradient(-45deg, #614EA9, #3d3a5a, #2C2A4A, #4a477a, #5d4fa9)"
      : "linear-gradient(-45deg, #C3B4FF, #D4CCFF, #E8EAF6, #EDE9FF, #B8AEEE)";

  const isRtl = language === "ar";

  // Pick which card body to render based on state
  let body: React.ReactNode;

  if (!hasToken) {
    body = (
      <CardContent className="p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t.invalidTitle}</h2>
          <p className="text-sm text-muted-foreground mt-2">{t.invalidBody}</p>
        </div>
        <Button
          onClick={() => router.push("/")}
          className="w-full bg-[#614EA9] hover:bg-[#7B5FB2] text-white"
        >
          {t.backToLogin}
        </Button>
      </CardContent>
    );
  } else if (isSuccess) {
    body = (
      <CardContent className="p-8 space-y-6 text-center">
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
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t.successTitle}</h2>
          <p className="text-sm text-muted-foreground mt-2">{t.successBody}</p>
        </div>
        <Button
          onClick={() => router.push("/")}
          className="w-full bg-[#614EA9] hover:bg-[#7B5FB2] text-white"
        >
          {t.goToLogin}
        </Button>
      </CardContent>
    );
  } else {
    body = (
      <CardContent className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-[#614EA9]" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">{t.formTitle}</h2>
          <p className="text-sm text-muted-foreground">{t.formBody}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">{t.newPasswordLabel}</Label>
            <Input
              id="new-password"
              type="password"
              placeholder={t.newPasswordPlaceholder}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="new-password"
              className="focus-visible:ring-[#614EA9]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t.confirmPasswordLabel}</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder={t.confirmPasswordPlaceholder}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="new-password"
              className="focus-visible:ring-[#614EA9]"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#614EA9] hover:bg-[#7B5FB2] text-white"
          >
            {isSubmitting ? t.updatingButton : t.updateButton}
          </Button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {t.cancelButton}
          </button>
        </form>
      </CardContent>
    );
  }

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen transition-colors duration-300 relative"
      onMouseMove={handleMouseMove}
      style={{
        background: gradientStyle,
        backgroundSize: "400% 400%",
        animation: "gradient-shift 18s ease infinite",
      }}
    >
      {/* Cursor-tracked radial glow — same as auth page */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{ background: glowBg }}
      />

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
          {body}
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
