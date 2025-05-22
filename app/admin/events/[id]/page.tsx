"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import { getEventById, deleteEvent } from "@/services/event-service"
import { getEventProgramByEventId } from "@/services/event-program-service"
import AuthGuard from "@/components/route-guards/auth-guard"
import Navbar from "@/components/navbar"
import { Edit, Trash2, ChevronLeft, Plus } from "lucide-react"
import EventProgramViewer from "@/components/event-program-viewer"

export default function EventDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [eventProgram, setEventProgram] = useState<any>(null)
  const [loadingProgram, setLoadingProgram] = useState(false)

  useEffect(() => {
    async function fetchEventData() {
      try {
        setLoading(true)
        const eventId = Array.isArray(id) ? id[0] : id

        // Obtener token del localStorage
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        // Obtener datos del evento
        const eventData = await getEventById(eventId, token)
        setEvent(eventData)

        // Intentar obtener el programa del evento
        try {
          setLoadingProgram(true)
          const programData = await getEventProgramByEventId(eventId, token)
          // Si programData es null, significa que no hay programa para este evento
          setEventProgram(programData)
        } catch (programError) {
          console.error("Error fetching event program:", programError)
          // No establecemos error general, solo para el programa
          setEventProgram(null)
        } finally {
          setLoadingProgram(false)
        }

        setError(null)
      } catch (err: any) {
        console.error("Error fetching event data:", err)
        setError(err.message || "Error al cargar los datos del evento")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEventData()
    }
  }, [id])

  const handleDeleteEvent = async () => {
    try {
      const eventId = Array.isArray(id) ? id[0] : id
      const token = localStorage.getItem("token")

      if (!token) {
        throw new Error("No token found")
      }

      await deleteEvent(eventId, token)

      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado correctamente",
      })

      router.push("/admin/dashboard?tab=events")
    } catch (err: any) {
      console.error("Error deleting event:", err)
      toast({
        title: "Error",
        description: err.message || "Error al eliminar el evento",
        variant: "destructive",
      })
    } finally {
      setIsDeleteModalOpen(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-rich-black text-white pt-20">
          <Navbar />
          <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burgundy"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error || !event) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-rich-black text-white pt-20">
          <Navbar />
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto bg-dark-gray p-6 rounded-lg">
              <h1 className="text-2xl font-bold mb-4">Error</h1>
              <p className="text-gray-light mb-6">{error || "No se encontró el evento"}</p>
              <Link
                href="/admin/dashboard?tab=events"
                className="inline-flex items-center px-4 py-2 bg-burgundy hover:bg-burgundy/90 text-white rounded-md transition-colors"
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                Volver al dashboard
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />

        <div className="container mx-auto px-4 py-16">
          <div className="mb-6">
            <Link
              href="/admin/dashboard?tab=events"
              className="inline-flex items-center text-gray-light hover:text-white transition-colors"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Volver al dashboard
            </Link>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
            <h1 className="text-3xl font-bold">{event.title}</h1>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/events/${event._id}/edit`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700 mb-8">
            <div className="flex flex-wrap -mb-px">
              <button
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === "details"
                    ? "text-burgundy border-burgundy"
                    : "border-transparent hover:text-gray-300 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("details")}
              >
                Detalles
              </button>
              <button
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === "program"
                    ? "text-burgundy border-burgundy"
                    : "border-transparent hover:text-gray-300 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("program")}
              >
                Programa
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "details" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Event Details */}
              <div className="md:col-span-2 bg-dark-gray p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Información del evento</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-gray-light text-sm mb-1">Título</p>
                    <p className="font-medium">{event.title}</p>
                  </div>
                  <div>
                    <p className="text-gray-light text-sm mb-1">Fecha</p>
                    <p className="font-medium">{formatDate(event.date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-light text-sm mb-1">Ubicación</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                  <div>
                    <p className="text-gray-light text-sm mb-1">Destacado</p>
                    <p className="font-medium">{event.isFeatured ? "Sí" : "No"}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-light text-sm mb-1">Descripción</p>
                  <p className="whitespace-pre-line">{event.description}</p>
                </div>

                <div>
                  <p className="text-gray-light text-sm mb-1">ID del evento</p>
                  <p className="font-mono text-sm">{event._id}</p>
                </div>
              </div>

              {/* Event Image */}
              <div className="bg-dark-gray p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Imagen del evento</h2>

                <div className="aspect-video relative rounded-md overflow-hidden">
                  {event.image ? (
                    <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <p className="text-gray-light">Sin imagen</p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-gray-light text-sm">
                    {event.image ? "Imagen cargada correctamente" : "Este evento no tiene imagen"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-dark-gray p-6 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Programa del evento</h2>

                <Link
                  href={`/admin/event-programs/new?eventId=${event._id}`}
                  className="inline-flex items-center px-4 py-2 bg-burgundy hover:bg-burgundy/90 text-white rounded-md transition-colors"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {eventProgram ? "Crear nuevo programa" : "Crear programa"}
                </Link>
              </div>

              {loadingProgram ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-burgundy"></div>
                </div>
              ) : eventProgram ? (
                <EventProgramViewer program={eventProgram} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-light mb-6">Este evento aún no tiene un programa definido.</p>
                  <Link
                    href={`/admin/event-programs/new?eventId=${event._id}`}
                    className="inline-flex items-center px-6 py-3 bg-burgundy hover:bg-burgundy/90 text-white rounded-md transition-colors"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Crear programa ahora
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-gray p-6 rounded-lg max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Confirmar eliminación</h3>
              <p className="text-gray-light mb-6">
                ¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
