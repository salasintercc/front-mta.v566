"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PaymentService } from "@/services/payment-service"
import { useAuth } from "@/contexts/auth-context"
import { CreditCard, Euro, AlertCircle } from "lucide-react"

interface PaymentFormProps {
  amount: string
  description?: string
  onSuccess?: (paymentUrl: string) => void
  onError?: (error: Error) => void
  buttonText?: string
  redirectToPayment?: boolean
  customRedirectUrl?: string
}

export default function PaymentForm({
  amount,
  description = "Pago en Meet The Architect",
  onSuccess,
  onError,
  buttonText = "Proceder al pago",
  redirectToPayment = true,
  customRedirectUrl,
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  const handlePayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Construir la URL de redirección
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const redirectUrl = customRedirectUrl || `${origin}/payment/success`

      // Crear el pago
      const response = await PaymentService.createPayment({
        amount,
        description: `${description}${user ? ` - Usuario: ${user.email}` : ""}`,
        redirectUrl,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Manejar la respuesta exitosa
      if (onSuccess) {
        onSuccess(response.paymentUrl)
      }

      // Redirigir al usuario a la página de pago de Mollie si se solicita
      if (redirectToPayment) {
        window.location.href = response.paymentUrl
      }
    } catch (err) {
      console.error("Error al procesar el pago:", err)
      setError(err instanceof Error ? err.message : "Error al procesar el pago")

      if (onError && err instanceof Error) {
        onError(err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-dark-gray p-6 rounded-sm border border-gray-700">
      <div className="flex items-center mb-4">
        <CreditCard className="h-6 w-6 text-gold mr-2" />
        <h3 className="text-xl font-bold">Detalles del pago</h3>
      </div>

      <div className="mb-6">
        <div className="flex justify-between py-3 border-b border-gray-700">
          <span className="text-gray-light">Importe</span>
          <span className="font-medium flex items-center">
            <Euro className="h-4 w-4 mr-1" />
            {amount}
          </span>
        </div>

        <div className="flex justify-between py-3 border-b border-gray-700">
          <span className="text-gray-light">Descripción</span>
          <span>{description}</span>
        </div>

        <div className="flex justify-between py-3">
          <span className="text-gray-light">Método de pago</span>
          <span>Mollie (Tarjeta, PayPal, etc.)</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 p-3 rounded-sm mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-burgundy hover:bg-burgundy/90 text-white py-3 font-medium transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></span>
            Procesando...
          </span>
        ) : (
          buttonText
        )}
      </button>

      <p className="text-xs text-gray-light mt-4 text-center">
        Serás redirigido a la plataforma segura de Mollie para completar el pago
      </p>
    </div>
  )
}
