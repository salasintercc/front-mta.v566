"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PaymentForm from "@/components/payment/payment-form"
import { useAuth } from "@/contexts/auth-context"
import LoginModal from "@/components/auth/login-modal"
import { AlertCircle } from "lucide-react"

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  // Obtener parámetros de la URL
  const amount = searchParams.get("amount") || "0.00"
  const description = searchParams.get("description") || "Pago en Meet The Architect"
  const redirectUrl = searchParams.get("redirectUrl") || "/payment/success"

  // Verificar si el usuario está autenticado
  useEffect(() => {
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
    }
  }, [isAuthenticated, amount, description, redirectUrl])

  // Manejar cierre del modal de login
  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false)

    // Si el usuario sigue sin autenticarse, redirigir al inicio
    if (!isAuthenticated) {
      router.push("/")
    }
  }

  // Manejar error en el pago
  const handlePaymentError = (error: Error) => {
    console.error("Error en el pago:", error)
    // Aquí podrías implementar alguna lógica adicional para manejar errores
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <section className="py-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Finalizar compra</h1>

          {!isAuthenticated ? (
            <div className="bg-dark-gray p-8 rounded-sm border border-gray-700 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Inicia sesión para continuar</h2>
              <p className="text-gray-light mb-6">Necesitas iniciar sesión para completar tu compra.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Resumen del pedido</h2>
                <div className="bg-dark-gray p-6 rounded-sm border border-gray-700 mb-6">
                  <div className="border-b border-gray-700 pb-4 mb-4">
                    <h3 className="font-medium mb-2">{description}</h3>
                    <p className="text-gray-light text-sm">
                      Al completar este pago, aceptas nuestros términos y condiciones.
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-light">Total</span>
                    <span className="text-xl font-bold">€{amount}</span>
                  </div>
                </div>

                <div className="bg-burgundy/20 p-4 rounded-sm border border-burgundy">
                  <p className="text-sm">
                    <strong>Nota:</strong> Una vez completado el pago, recibirás un correo electrónico con la
                    confirmación y los detalles de tu compra.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Método de pago</h2>
                <PaymentForm
                  amount={amount}
                  description={description}
                  customRedirectUrl={redirectUrl}
                  onError={handlePaymentError}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Modal de login */}
      <LoginModal isOpen={isLoginModalOpen} onClose={handleLoginModalClose} redirectPath="/payment/checkout" />
    </main>
  )
}
