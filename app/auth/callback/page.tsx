"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import UserTypeSelectionModal from "@/components/auth/user-type-selection-modal"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleGoogleCallback, user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [showTypeModal, setShowTypeModal] = useState(false)

  useEffect(() => {
    const processToken = async () => {
      try {
        const token = searchParams.get("token")

        // Verificar si hay un token en la URL
        if (token) {
          try {
            // Procesar el token
            await handleGoogleCallback(token)

            // Redirigir al usuario según su estado de perfil
            const user = JSON.parse(localStorage.getItem("user") || "{}")

            if (user.isProfileCompleted === false) {
              // Si el perfil no está completo, redirigir a la página de completar perfil
              router.push("/users/complete-profile")
            } else {
              // Si el perfil está completo, redirigir al dashboard
              router.push("/users/dashboard")
            }
          } catch (error) {
            console.error("Error al procesar el callback de Google:", error)
            setError("Error al procesar la autenticación con Google")
          }
        } else {
          setError("No se recibió un token válido")
          setIsProcessing(false)
          return
        }

        // Mostrar el modal para seleccionar el tipo de usuario
        // setShowTypeModal(true)
        setIsProcessing(false)
      } catch (err: any) {
        console.error("Error en el callback de autenticación:", err)
        setError(err.message || "Ocurrió un error durante la autenticación")
        setIsProcessing(false)
      }
    }

    if (isProcessing) {
      processToken()
    }
  }, [searchParams, handleGoogleCallback, isProcessing, router])

  const handleCloseModal = () => {
    setShowTypeModal(false)
    // Redirigir al usuario a la página principal si cierra el modal sin seleccionar
    router.push("/")
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rich-black p-4">
        <div className="w-full max-w-md rounded-lg bg-dark-gray p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-cormorant font-light tracking-wider uppercase text-white">
            Error de autenticación
          </h1>
          <p className="mb-6 text-red-400">{error}</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full rounded bg-burgundy py-2 text-white transition-colors hover:bg-burgundy/80"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rich-black p-4">
        <div className="w-full max-w-md rounded-lg bg-dark-gray p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-cormorant font-light tracking-wider uppercase text-white">
            Procesando autenticación
          </h1>
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-4 border-burgundy border-t-gold"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-rich-black">
      <UserTypeSelectionModal isOpen={showTypeModal} onClose={handleCloseModal} />
    </div>
  )
}
