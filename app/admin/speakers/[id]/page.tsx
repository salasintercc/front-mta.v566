"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { getSpeakerById } from "@/services/speaker-service"
import { getEventById } from "@/services/event-service"
import type { Speaker } from "@/services/speaker-service"
import type { Event } from "@/services/event-service"
import { ArrowLeft, Edit, Calendar, MapPin, Briefcase, Mic } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ViewSpeakerPage() {
  const params = useParams()
  const router = useRouter()
  const speakerId = params.id as string

  const [speaker, setSpeaker] = useState<Speaker | null>(null)
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

        // Cargar el ponente
        const speakerData = await getSpeakerById(speakerId, token)
        setSpeaker(speakerData)

        // Cargar el evento asociado
        const eventData = await getEventById(speakerData.eventId, token)
        setEvent(eventData)
      } catch (err: any) {
        console.error("Error fetching speaker:", err)
        setError(err.message || "Error al cargar los datos del ponente")
      } finally {
        setIsLoading(false)
      }
    }

    if (speakerId) {
      fetchData()
    }
  }, [speakerId])

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
              <h1 className="text-3xl md:text-4xl font-bold">Detalles del Ponente</h1>
              <Link
                href="/admin/dashboard?tab=speakers"
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
                <p className="mt-4">Cargando datos del ponente...</p>
              </div>
            ) : speaker ? (
              <div className="bg-dark-gray rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                  {/* Imagen del ponente */}
                  <div className="md:col-span-1">
                    <div className="relative h-[300px] w-full bg-rich-black rounded-md overflow-hidden">
                      {speaker.image ? (
                        <Image
                          src={speaker.image || "/placeholder.svg"}
                          alt={speaker.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Mic className="h-16 w-16 text-gray-light/50" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información del ponente */}
                  <div className="md:col-span-2">
                    <h2 className="text-2xl font-bold mb-2">{speaker.name}</h2>
                    <p className="text-gold text-lg mb-4">{speaker.position}</p>

                    <div className="space-y-4 mb-6">
                      {speaker.company && (
                        <div className="flex items-center">
                          <Briefcase className="h-5 w-5 text-gold mr-3" />
                          <span>{speaker.company}</span>
                        </div>
                      )}

                      {event && (
                        <>
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-gold mr-3" />
                            <span>
                              Evento: {event.title} ({formatDate(event.date)})
                            </span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-5 w-5 text-gold mr-3" />
                            <span>{event.location}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {speaker.bio && (
                      <div>
                        <h3 className="text-xl font-bold mb-3">Biografía</h3>
                        <p className="text-gray-light whitespace-pre-line">{speaker.bio}</p>
                      </div>
                    )}

                    <div className="mt-8">
                      <Link
                        href={`/admin/speakers/${speakerId}/edit`}
                        className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2 w-fit"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar Ponente</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p>No se encontró el ponente</p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </AuthGuard>
  )
}
