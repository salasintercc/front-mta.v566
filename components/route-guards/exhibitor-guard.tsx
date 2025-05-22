"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface ExhibitorGuardProps {
  children: React.ReactNode
}

export default function ExhibitorGuard({ children }: ExhibitorGuardProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated) {
      router.push("/login?redirect=/webinars")
      return
    }

    // Verificar si el usuario es un exhibidor o admin
    if (user && (user.role === "exhibitor" || user.role === "admin")) {
      setIsAuthorized(true)
    } else {
      router.push("/unauthorized?message=Solo los expositores pueden acceder a esta sección")
    }

    setIsLoading(false)
  }, [isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-rich-black">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gold"></div>
          <p className="mt-4 text-white">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  return isAuthorized ? <>{children}</> : null
}
