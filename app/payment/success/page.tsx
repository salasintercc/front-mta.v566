"use client"

import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import Navbar from "@/components/navbar"
import { PaymentStatusModal } from "@/components/payment/payment-status-modal"

export default function PaymentSuccessPage() {
  const router = useRouter()

  const handleRedirect = useCallback((path: string) => {
    router.push(path)
  }, [router])

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <section className="py-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-dark-gray p-8 rounded-sm border border-gray-700 text-center">
            <div className="flex flex-col items-center mb-6">
              <Check className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">¡Pago Recibido!</h2>
              <p className="text-gray-light">
                Tu pago está siendo procesado. Serás redirigido automáticamente.
              </p>
            </div>
          </div>
          
          <PaymentStatusModal
            onRedirect={handleRedirect}
            onSuccess={() => console.log('Redirigiendo al dashboard...')}
            onError={() => handleRedirect('/payment/failed')}
          />
        </div>
      </section>
    </main>
  )
}
