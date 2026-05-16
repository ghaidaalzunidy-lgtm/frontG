"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Check, MailCheck, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCursorGlow } from "@/hooks/use-cursor-glow";
import { verifyEmail } from "@/lib/api";

type Status = "verifying" | "success" | "error";
type Lang = "en" | "ar";

// Inner component is wrapped in <Suspense> because useSearchParams()
// needs a suspense boundary during static rendering (Next.js 14+).
function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { theme, resolvedTheme } = useTheme();
  const { glowBg, handleMouseMove } = useCursorGlow();

  const [status, setStatus] = useState<Status>("verifying");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<Lang>("en");

  // Prevent React's StrictMode double-mount from firing the backend call
  // twice. The verify-email token is single-use, so the second call would
  // always fail with "Invalid verification token" even on a happy path.
  const hasRunRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    // Read the user's last-chosen language from localStorage (same key the
    // app context uses). Falls back to English if not set.
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("language");
      if (stored === "ar" || stored === "en") setLanguage(stored);
    }
  }, []);

  // Kick off verification on mount
  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    if (!token) {
      setStatus("error");
      setErrorMsg(
        language === "en"
          ? "This verification link is missing or malformed."
          : "رابط التحقق هذا مفقود أو غير صالح."
      );
      return;
    }

    (async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMsg(
          err instanceof Error
            ? err.message
            : language === "en"
              ? "Could not verify your email. The link may be invalid or expired."
              : "تعذر التحقق من بريدك الإلكتروني. قد يكون الرابط غير صالح أو منتهي الصلاحية."
        );
      }
    })();
  }, [token, language]);

  // Auto-redirect to login a few seconds after a successful verification
  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => router.push("/"), 3500);
    return () => clearTimeout(t);
  }, [status, router]);

  // Mirror the auth page's animated diagonal gradient (light/dark variants)
  const currentTheme = mounted ? (resolvedTheme ?? theme) : "light";
  const gradientStyle =
    currentTheme === "dark"
      ? "linear-gradient(-45deg, #614EA9, #3d3a5a, #2C2A4A, #4a477a, #5d4fa9)"
      : "linear-gradient(-45deg, #C3B4FF, #D4CCFF, #E8EAF6, #EDE9FF, #B8AEEE)";

  const isRtl = language === "ar";

  // All translatable strings in one place
  const t = {
    verifyingTitle: language === "en" ? "Verifying your email" : "جارٍ التحقق من بريدك الإلكتروني",
    verifyingBody: language === "en"
      ? "Just a moment while we confirm your account…"
      : "لحظة من فضلك بينما نؤكد حسابك…",
    successTitle: language === "en" ? "Email Verified" : "تم التحقق من البريد الإلكتروني",
    successBody: language === "en"
      ? "Your account is ready. Redirecting you to login…"
      : "حسابك جاهز. جارٍ تحويلك إلى تسجيل الدخول…",
    goToLogin: language === "en" ? "Go to Login" : "الذهاب إلى تسجيل الدخول",
    failedTitle: language === "en" ? "Verification Failed" : "فشل التحقق",
    failedFallback: language === "en"
      ? "This verification link is invalid or has already been used."
      : "رابط التحقق هذا غير صالح أو تم استخدامه بالفعل.",
    failedHint: language === "en"
      ? "If your link expired, sign up again or contact your administrator to re-send a verification email."
      : "إذا انتهت صلاحية الرابط، فقم بالتسجيل مرة أخرى أو تواصل مع المسؤول لإعادة إرسال بريد التحقق.",
    backToLogin: language === "en" ? "Back to Login" : "العودة إلى تسجيل الدخول",
  };

  // Pick body content based on status
  let body: React.ReactNode;

  if (status === "verifying") {
    body = (
      <CardContent className="p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#614EA9] animate-spin" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t.verifyingTitle}</h2>
          <p className="text-sm text-muted-foreground mt-2">{t.verifyingBody}</p>
        </div>
      </CardContent>
    );
  } else if (status === "success") {
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
        <div className="flex items-center justify-center gap-2 text-foreground">
          <MailCheck className="w-5 h-5 text-[#614EA9]" />
          <h2 className="text-xl font-semibold">{t.successTitle}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t.successBody}</p>
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
      <CardContent className="p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t.failedTitle}</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {errorMsg || t.failedFallback}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{t.failedHint}</p>
        <Button
          onClick={() => router.push("/")}
          className="w-full bg-[#614EA9] hover:bg-[#7B5FB2] text-white"
        >
          {t.backToLogin}
        </Button>
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
      {/* Cursor-tracked radial glow — same hook as the auth page */}
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
} 