"use client"

import { useState, useEffect } from "react"
import { Check, X, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  redirectPath?: string
  redirectDelay?: number // en milisegundos
  isError?: boolean // Nuevo prop para indicar si es un mensaje de error
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  redirectPath,
  redirectDelay = 2000,
  isError = false, // Por defecto no es un error
}: SuccessModalProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(redirectDelay / 1000)

  useEffect(() => {
    if (!isOpen || !redirectPath || isError) return // No redirigir si es un error

    // Iniciar cuenta regresiva
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Configurar redirección
    const timeout = setTimeout(() => {
      onClose()
      router.push(redirectPath)
    }, redirectDelay)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isOpen, redirectPath, redirectDelay, onClose, router, isError])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-rich-black border border-dark-gray max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-light hover:text-white"
          aria-label="Cerrar modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isError ? "bg-red-900/20" : "bg-green-900/20"} mb-4`}
          >
            {isError ? (
              <AlertTriangle className="h-8 w-8 text-red-500" />
            ) : (
              <Check className="h-8 w-8 text-green-500" />
            )}
          </div>

          <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
          <p className="text-gray-light mb-6">{message}</p>

          {redirectPath && !isError && <p className="text-sm text-gold">Redirigiendo en {countdown} segundos...</p>}

          <button
            onClick={onClose}
            className={`mt-4 ${isError ? "bg-red-600 hover:bg-red-700" : "bg-burgundy hover:bg-burgundy/90"} text-white px-6 py-2 transition-colors`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
