"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AppProvider, useApp } from "@/lib/app-context"
import { LoadingScreen } from "@/components/loading-screen"
import { HomePage } from "@/components/home-page"
import { AuthPage } from "@/components/auth-page"
import { EmployeePortal } from "@/components/employee-portal"
import { HRDashboard } from "@/components/hr-dashboard"
import { ToastContainer } from "@/components/toast"
import { VerifyEmailSuccess } from "@/components/verify-email-success"
function AppContent() {
  const { view, isLoading } = useApp()
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  if (initialLoading || isLoading) {
    return <LoadingScreen />
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          transition={{ duration: 0.3 }}
        >
          {view === "home" && <HomePage />}
          {view === "login" && <AuthPage />}
          {view === "register" && <AuthPage />}
          {view === "employee-portal" && <EmployeePortal />}
          {view === "hr-dashboard" && <HRDashboard />}
          {view === "verify-email" && <VerifyEmailSuccess />}
        </motion.div>
      </AnimatePresence>
      <ToastContainer />
    </>
  )
}

export default function MoodLoopApp() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
