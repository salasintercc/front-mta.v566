"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface ProfileCompletionGuardProps {
  children: React.ReactNode
}

export default function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
  const { user, isAuthenticated, isProfileComplete } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Si el usuario está autenticado pero su perfil no está completo
    if (isAuthenticated && user && !isProfileComplete) {
      router.push("/users/complete-profile")
    }
  }, [isAuthenticated, user, isProfileComplete, router])

  // Si el usuario está autenticado y su perfil está completo, mostrar los hijos
  // O si el usuario no está autenticado (la autenticación se manejará en otro lugar)
  return <>{children}</>
}
