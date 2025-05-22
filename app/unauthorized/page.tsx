"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function UnauthorizedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState<string>("No tienes permiso para acceder a esta página.")
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Obtener el mensaje personalizado de los parámetros de búsqueda
    const customMessage = searchParams.get("message")
    if (customMessage) {
      setMessage(customMessage)
    }

    // Iniciar cuenta regresiva para redirigir al usuario
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, searchParams])

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="bg-dark-gray rounded-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-burgundy/20 p-4 rounded-full">
              <AlertTriangle className="h-12 w-12 text-burgundy" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">Acceso no autorizado</h1>

          <p className="text-gray-light mb-8">{message}</p>

          <p className="text-gray-light mb-8">
            Serás redirigido a la página principal en <span className="text-gold font-bold">{countdown}</span> segundos.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-burgundy hover:bg-burgundy/90 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al inicio</span>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
