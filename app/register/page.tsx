"use client"

import { useEffect } from "react"
import { AuthPage } from "@/components/auth-page"
import { useApp } from "@/lib/app-context"

export default function RegisterPage() {
  const { setView, setAuthMode } = useApp()

  useEffect(() => {
    setView("register")
    setAuthMode("signup")
  }, [setView, setAuthMode])

  return <AuthPage />
}