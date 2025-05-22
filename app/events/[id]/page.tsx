"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { getPublicEventById } from "@/services/public-event-service"
import { getPublicSpeakersByEvent } from "@/services/public-speaker-service"
import { getPublicEventProgramByEventId, type EventProgram } from "@/services/public-event-program-service"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Calendar, MapPin, Users, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const [event, setEvent] = useState<any>(null)
  const [speakers, setSpeakers] = useState<any[]>([])
  const [program, setProgram] = useState<EventProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEventData() {
      try {
        setLoading(true)
        const eventId = Array.isArray(id) ? id[0] : id

        // Obtener datos del evento
        const eventData = await getPublicEventById(eventId)
        setEvent(eventData)

        // Obtener ponentes del evento
        const speakersData = await getPublicSpeakersByEvent(eventId)
        setSpeakers(speakersData)

        // Obtener programa del evento
        const programData = await getPublicEventProgramByEventId(eventId)
        setProgram(programData)

        setError(null)
      } catch (err) {
        console.error("Error fetching event data:", err)
        setError("Error al cargar los datos del evento")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEventData()
    }
  }, [id])

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
      <div className="min-h-screen bg-rich-black text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burgundy"></div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-rich-black text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-6">Error</h1>
            <p className="text-gray-light mb-8">{error || "No se encontró el evento"}</p>
            <Link
              href="/events"
              className="inline-flex items-center px-6 py-3 bg-burgundy hover:bg-burgundy/90 text-white rounded-md transition-colors"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Volver a eventos
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-rich-black text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px]">
        {event.image ? (
          <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-burgundy to-dark-gray"></div>
        )}
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <Link
                href="/events"
                className="inline-flex items-center text-gray-light hover:text-white mb-4 transition-colors"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Volver a eventos
              </Link>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gold" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-gold" />
                  <span>{event.location}</span>
                </div>
                {event.capacity && (
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-gold" />
                    <span>Capacidad: {event.capacity}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Acerca del evento</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-light whitespace-pre-line">{event.description}</p>
              </div>
            </div>
            <div className="bg-dark-gray p-6 rounded-lg h-fit">
              <h3 className="text-xl font-bold mb-4">Detalles</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-light text-sm">Fecha</p>
                  <p className="font-medium">{formatDate(event.date)}</p>
                </div>
                <div>
                  <p className="text-gray-light text-sm">Ubicación</p>
                  <p className="font-medium">{event.location}</p>
                </div>
                {event.time && (
                  <div>
                    <p className="text-gray-light text-sm">Hora</p>
                    <p className="font-medium">{event.time}</p>
                  </div>
                )}
                {event.capacity && (
                  <div>
                    <p className="text-gray-light text-sm">Capacidad</p>
                    <p className="font-medium">{event.capacity} asistentes</p>
                  </div>
                )}
                <div className="pt-4">
                  <Link
                    href={`/tickets?eventId=${event._id}`}
                    className="block w-full py-3 bg-burgundy hover:bg-burgundy/90 text-white text-center rounded-md transition-colors"
                  >
                    Reservar entrada
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Section */}
      {program && program.days && program.days.length > 0 && (
        <section className="py-16 bg-dark-gray">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Programa del evento</h2>

            <div className="space-y-8">
              {program.days.map((day, dayIndex) => (
                <div key={dayIndex} className="bg-rich-black p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-gold">
                    {new Date(day.date).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h3>
                  <div className="space-y-6">
                    {day.sessions.map((session, sessionIndex) => (
                      <div key={sessionIndex} className="border-l-2 border-burgundy pl-4 py-2">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-white">{session.title}</h4>
                          {session.startTime && (
                            <span className="text-sm text-gold">
                              {session.startTime} {session.endTime && `- ${session.endTime}`}
                            </span>
                          )}
                        </div>
                        {session.description && <p className="text-gray-light">{session.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Speakers Section */}
      {speakers && speakers.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Ponentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {speakers.map((speaker) => (
                <div key={speaker._id} className="bg-dark-gray p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    {speaker.image ? (
                      <div className="relative h-16 w-16 rounded-full overflow-hidden mr-4">
                        <Image
                          src={speaker.image || "/placeholder.svg"}
                          alt={speaker.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-burgundy/20 flex items-center justify-center mr-4">
                        <span className="text-burgundy text-xl font-bold">{speaker.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{speaker.name}</h3>
                      <p className="text-gray-light text-sm">{speaker.position}</p>
                      {speaker.company && <p className="text-gold text-sm">{speaker.company}</p>}
                    </div>
                  </div>
                  {speaker.bio && <p className="text-gray-light text-sm line-clamp-4">{speaker.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
