"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PaymentForm from "@/components/payment/payment-form"
import { useAuth } from "@/contexts/auth-context"
import { getTicketDetails } from "@/services/ticket-service"
import { getTicketTypesByEvent } from "@/services/ticket-type-service"
import { Loader2, AlertCircle, Calendar, MapPin, Users } from "lucide-react"

export default function TicketPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ticket, setTicket] = useState<any>(null)
  const [ticketType, setTicketType] = useState<any>(null)
  const [amount, setAmount] = useState("0.00")

  useEffect(() => {
    // Verificar autenticación
    if (!isAuthenticated) {
      router.push("/login?redirect=/tickets")
      return
    }

    const ticketId = params.id as string

    // Cargar detalles del ticket
    const loadTicketDetails = async () => {
      try {
        setIsLoading(true)

        // Obtener detalles del ticket
        const ticketDetails = await getTicketDetails(ticketId)
        setTicket(ticketDetails)

        // Si el ticket tiene un eventId, obtener los tipos de tickets disponibles
        if (ticketDetails.eventId) {
          const ticketTypes = await getTicketTypesByEvent(ticketDetails.eventId)

          // Seleccionar el tipo de ticket estándar o el primero disponible
          const standardType = ticketTypes.find((t) => t.name.toLowerCase() === "standard") || ticketTypes[0]

          if (standardType) {
            setTicketType(standardType)
            setAmount(standardType.price.toString())
          } else {
            // Si no hay tipos de tickets disponibles, usar un precio por defecto
            setAmount("50.00")
          }
        } else {
          // Si es un webinar, usar un precio fijo
          setAmount("15.00")
        }
      } catch (err) {
        console.error("Error al cargar detalles del ticket:", err)
        setError("No se pudieron cargar los detalles del ticket")
      } finally {
        setIsLoading(false)
      }
    }

    loadTicketDetails()
  }, [isAuthenticated, params.id, router])

  // Construir la descripción del pago
  const getPaymentDescription = () => {
    if (!ticket) return "Pago de ticket"

    return ticket.type === "event"
      ? `Ticket para evento: ${ticket.eventTitle}`
      : `Registro para webinar: ${ticket.eventTitle}`
  }

  // Construir la URL de redirección después del pago
  const getRedirectUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/payment/success?ticketId=${params.id}`
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-gold mb-4" />
            <h2 className="text-xl">Cargando detalles del pago...</h2>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-dark-gray p-8 rounded-sm border border-gray-700 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p className="text-gray-light mb-6">{error || "No se pudo encontrar el ticket solicitado"}</p>
              <button
                onClick={() => router.push("/tickets")}
                className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 transition-colors"
              >
                Volver a tickets
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <section className="py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Pago de Ticket</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Detalles del {ticket.type === "event" ? "Evento" : "Webinar"}</h2>

              <div className="bg-dark-gray p-6 rounded-sm border border-gray-700 mb-6">
                <h3 className="text-xl font-bold mb-4">{ticket.eventTitle}</h3>
                <p className="text-gray-light mb-6">{ticket.eventDescription}</p>

                <div className="space-y-4">
                  {ticket.eventDate && (
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 mr-3 text-gold mt-1" />
                      <div>
                        <p className="font-medium">Fecha</p>
                        <p className="text-gray-light">{new Date(ticket.eventDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}

                  {ticket.eventLocation && (
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 text-gold mt-1" />
                      <div>
                        <p className="font-medium">Ubicación</p>
                        <p className="text-gray-light">{ticket.eventLocation}</p>
                      </div>
                    </div>
                  )}

                  {ticketType && (
                    <div className="flex items-start">
                      <Users className="h-5 w-5 mr-3 text-gold mt-1" />
                      <div>
                        <p className="font-medium">Tipo de ticket</p>
                        <p className="text-gray-light">{ticketType.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-burgundy/20 p-4 rounded-sm border border-burgundy">
                <p className="text-sm">
                  <strong>Nota:</strong> Una vez completado el pago, tu ticket será activado automáticamente y podrás
                  acceder a todos los detalles desde tu panel de usuario.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Método de pago</h2>
              <PaymentForm amount={amount} description={getPaymentDescription()} customRedirectUrl={getRedirectUrl()} />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
