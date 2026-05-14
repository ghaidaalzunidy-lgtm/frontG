"use client";

import { motion } from "framer-motion";
import { Users, Building2, ArrowRight, Languages, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp, translations } from "@/lib/app-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { useCursorGlow } from "@/hooks/use-cursor-glow";
import { FloatingContactButton } from "@/components/floating-contact-button";

export function HomePage() {
  const {
    setView,
    setUserType,
    setAuthMode,
    language,
    setLanguage,
  } = useApp();

  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const t = translations[language];
  const { glowBg, handleMouseMove } = useCursorGlow();

  const gradientStyle =
    currentTheme === "dark"
      ? "linear-gradient(-45deg, #614EA9, #3d3a5a, #2C2A4A, #4a477a, #5d4fa9)"
      : "linear-gradient(-45deg, #C3B4FF, #D4CCFF, #E8EAF6, #EDE9FF, #B8AEEE)";

  const handleSelectRole = (role: "employee" | "hr") => {
    setUserType(role);
    setAuthMode("login");
    setView("login");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300 flex flex-col"
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
        {/* Empty left space for RTL/LTR consistency */}
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

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-0 relative z-10">
        <div className="w-full max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Side - Logo, Welcome & Features */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 md:space-y-8"
            >
              {/* Logo and Welcome */}
              <div>
                <Image
                  src="/assets/logo.png"
                  alt="MoodLoop"
                  width={220}
                  height={55}
                  className="object-contain mb-4"
                  priority
                />
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#2C2A4A] dark:text-white mb-2">
                  {t.welcome || "Welcome to MoodLoop"}
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  {t.tagline || "Transform your workplace culture with real-time employee well-being insights"}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg" style={{ filter: "grayscale(100%)" }}>😊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C2A4A] dark:text-white text-sm md:text-base">
                      {t.anonymous || "Anonymous feedback system"}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      {t.safeSpace || "Safe space for honest communication"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg" style={{ filter: "grayscale(100%)" }}>📊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C2A4A] dark:text-white text-sm md:text-base">
                      {t.realTimeAnalytics || "Real-time analytics"}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      {t.trackTrends || "Track trends and improvements"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg" style={{ filter: "grayscale(100%)" }}>❤️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C2A4A] dark:text-white text-sm md:text-base">
                      {t.fosterTeam || "Foster team spirit"}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      {t.positiveEnv || "Build a positive work environment"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Featured Portal Selection Card */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card
                className="border-0 shadow-2xl bg-white dark:bg-slate-950/40 backdrop-blur-xl rounded-3xl overflow-hidden"
                style={{
                  background:
                    currentTheme === "dark"
                      ? "rgba(15, 23, 42, 0.95)"
                      : "rgba(255, 255, 255, 0.98)",
                }}
              >
                <CardContent className="p-8 md:p-10 space-y-6">
                  {/* Card Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="text-center space-y-3"
                  >
                    <Image
                      src="/assets/logo.png"
                      alt="MoodLoop"
                      width={120}
                      height={30}
                      className="object-contain mx-auto"
                      priority
                    />
                    <h2 className="text-2xl md:text-3xl font-bold text-[#2C2A4A] dark:text-white">
                      {t.getStarted || "Get Started"}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.chooseRole || "Choose your role to continue"}
                    </p>
                  </motion.div>

                  {/* Portal Buttons */}
                  <div className="space-y-3">
                    {/* Employee Portal */}
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectRole("employee")}
                      className="w-full p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#614EA9] transition-all group text-left flex items-center gap-4 cursor-pointer bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    >
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-[#614EA9]" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#2C2A4A] dark:text-white text-sm group-hover:text-[#614EA9] transition-colors">
                          {t.employeePortal || "Employee Portal"}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {t.employeeDesc || "Share your daily emotions and feedback"}
                        </p>
                      </div>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <ArrowRight
                          className="h-5 w-5 text-[#614EA9] group-hover:text-[#2C2A4A] transition-colors flex-shrink-0"
                          strokeWidth={2}
                        />
                      </motion.div>
                    </motion.button>

                    {/* HR/Management Portal */}
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectRole("hr")}
                      className="w-full p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-[#614EA9] transition-all group text-left flex items-center gap-4 cursor-pointer bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    >
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-[#614EA9]" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#2C2A4A] dark:text-white text-sm group-hover:text-[#614EA9] transition-colors">
                          {t.hrPortal || "HR / Management Portal"}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {t.hrDesc || "Monitor and respond to team feedback"}
                        </p>
                      </div>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
                      >
                        <ArrowRight
                          className="h-5 w-5 text-[#614EA9] group-hover:text-[#2C2A4A] transition-colors flex-shrink-0"
                          strokeWidth={2}
                        />
                      </motion.div>
                    </motion.button>
                  </div>

                  {/* Security Message */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>🔒</span>
                      <span>{t.dataSecure || "Your data is encrypted and secure"}</span>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Floating Contact Button */}
      <FloatingContactButton />
    </div>
  );
}
