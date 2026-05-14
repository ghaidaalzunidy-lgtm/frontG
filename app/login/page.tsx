"use client"

import { useEffect } from "react"
import { AuthPage } from "@/components/auth-page"
import { useApp } from "@/lib/app-context"

export default function LoginPage() {
  const { setView, setAuthMode } = useApp()

  useEffect(() => {
    setView("login")
    setAuthMode("login")
  }, [setView, setAuthMode])

  return <AuthPage />
}