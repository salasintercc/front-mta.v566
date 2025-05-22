"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { getTicketTypeById } from "@/services/ticket-type-service"
import { getEventById } from "@/services/event-service"
import type { TicketType } from "@/services/ticket-type-service"
import type { Event } from "@/services/event-service"
import { ArrowLeft, Edit, Tag, Ticket, Package, Calendar, MapPin } from "lucide-react"
import Link from "next/link"

export default function ViewTicketTypePage() {
  const params = useParams()
  const router = useRouter()
  const ticketTypeId = params.id as string

  const [ticketType, setTicketType] = useState<TicketType | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        // Cargar el tipo de ticket
        const ticketTypeData = await getTicketTypeById(ticketTypeId, token)
        setTicketType(ticketTypeData)

        // Cargar el evento asociado
        const eventData = await getEventById(ticketTypeData.eventId, token)
        setEvent(eventData)
      } catch (err: any) {
        console.error("Error fetching ticket type:", err)
        setError(err.message || "Error al cargar los datos del tipo de ticket")
      } finally {
        setIsLoading(false)
      }
    }

    if (ticketTypeId) {
      fetchData()
    }
  }, [ticketTypeId])

  // Función para formatear la fecha
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl md:text-4xl font-bold">Detalles del Tipo de Ticket</h1>
              <Link
                href="/admin/dashboard?tab=ticket-types"
                className="flex items-center gap-2 text-gold hover:text-gold/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver al panel</span>
              </Link>
            </div>

            {error && (
              <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6">
                <p className="text-white">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                <p className="mt-4">Cargando datos del tipo de ticket...</p>
              </div>
            ) : ticketType ? (
              <div className="bg-dark-gray rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div className="flex items-center mb-4 md:mb-0">
                      <div className="bg-burgundy/20 h-12 w-12 rounded-full flex items-center justify-center mr-4">
                        <Ticket className="h-6 w-6 text-burgundy" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{ticketType.name}</h2>
                        <p className="text-gold text-lg">€{ticketType.price}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/ticket-types/${ticketTypeId}/edit`}
                        className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Tag className="h-5 w-5 text-gold mr-3" />
                        <div>
                          <p className="font-medium">Precio</p>
                          <p className="text-gray-light">€{ticketType.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gold mr-3" />
                        <div>
                          <p className="font-medium">Stock disponible</p>
                          <p className="text-gray-light">{ticketType.stock} tickets</p>
                        </div>
                      </div>
                    </div>

                    {event && (
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gold mr-3" />
                          <div>
                            <p className="font-medium">Evento</p>
                            <p className="text-gray-light">
                              {event.title} ({formatDate(event.date)})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gold mr-3" />
                          <div>
                            <p className="font-medium">Ubicación</p>
                            <p className="text-gray-light">{event.location}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {ticketType.benefits && ticketType.benefits.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-xl font-bold mb-4">Beneficios incluidos</h3>
                      <ul className="list-disc pl-5 space-y-2 text-gray-light">
                        {ticketType.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {ticketType.createdAt && (
                    <div className="border-t border-gray-700 pt-4 mt-6 text-sm text-gray-light">
                      <p>Creado: {new Date(ticketType.createdAt).toLocaleString()}</p>
                      {ticketType.updatedAt && (
                        <p>Última actualización: {new Date(ticketType.updatedAt).toLocaleString()}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p>No se encontró el tipo de ticket</p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </AuthGuard>
  )
}
