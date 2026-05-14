"use client"

import { useEffect } from "react"
import { HRDashboard } from "@/components/hr-dashboard"
import { useApp } from "@/lib/app-context"

export default function HRDashboardPage() {
  const { setView } = useApp()

  useEffect(() => {
    setView("hr-dashboard")
  }, [setView])

  return <HRDashboard />
}