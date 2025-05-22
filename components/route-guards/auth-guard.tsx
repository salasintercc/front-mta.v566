"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole }) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Si no está cargando y no está autenticado, redirigir al login
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
      return
    }

    // Si está autenticado pero se requiere un rol y el usuario no lo tiene
    if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      router.push("/unauthorized")
      return
    }

    // Si llegamos aquí, el usuario está autorizado
    if (!isLoading && isAuthenticated) {
      setIsAuthorized(true)
    }
  }, [isLoading, isAuthenticated, user, router, requiredRole])

  // Show nothing while checking auth
  if (isLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-rich-black">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
      </div>
    )
  }

  // If authorized, show children
  return <>{children}</>
}

export default AuthGuard
