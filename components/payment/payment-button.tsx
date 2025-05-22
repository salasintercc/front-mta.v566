"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import LoginModal from "@/components/auth/login-modal"
import { CreditCard } from "lucide-react"

interface PaymentButtonProps {
  amount: string
  description: string
  redirectUrl?: string
  className?: string
  children?: React.ReactNode
}

export default function PaymentButton({
  amount,
  description,
  redirectUrl,
  className = "bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 transition-colors",
  children,
}: PaymentButtonProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const handleClick = () => {
    if (!isAuthenticated) {
      // Guardar los datos del pago en localStorage para recuperarlos después del login
      localStorage.setItem(
        "pendingPayment",
        JSON.stringify({
          amount,
          description,
          redirectUrl,
        }),
      )

      // Mostrar modal de login
      setIsLoginModalOpen(true)
      return
    }

    // Construir la URL de checkout con los parámetros
    const params = new URLSearchParams()
    params.append("amount", amount)
    params.append("description", description)

    if (redirectUrl) {
      params.append("redirectUrl", redirectUrl)
    }

    // Redirigir a la página de checkout
    router.push(`/payment/checkout?${params.toString()}`)
  }

  // Manejar cierre del modal de login
  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false)
  }

  return (
    <>
      <button onClick={handleClick} className={className}>
        {children || (
          <span className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Pagar €{amount}
          </span>
        )}
      </button>

      {/* Modal de login */}
      <LoginModal isOpen={isLoginModalOpen} onClose={handleLoginModalClose} redirectPath="/payment/checkout" />
    </>
  )
}
