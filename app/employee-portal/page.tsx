"use client"

import { useEffect } from "react"
import { EmployeePortal } from "@/components/employee-portal"
import { useApp } from "@/lib/app-context"

export default function EmployeePortalPage() {
  const { setView } = useApp()

  useEffect(() => {
    setView("employee-portal")
  }, [setView])

  return <EmployeePortal />
}