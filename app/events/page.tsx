"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, Clock, User } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { getPublicEvents } from "@/services/public-event-service"
import { getPublicEventProgramByEventId, type EventProgram } from "@/services/public-event-program-service"
import { getPublicSpeakersByEvent, type PublicSpeaker } from "@/services/public-speaker-service"

export default function EventsPage() {
  const { t, isLoaded } = useLanguage()
  const { isAuthenticated } = useAuth()
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [currentProgram, setCurrentProgram] = useState<EventProgram | null>(null)
  const [loadingProgram, setLoadingProgram] = useState(false)
  const [speakers, setSpeakers] = useState<PublicSpeaker[]>([])
  const [loadingSpeakers, setLoadingSpeakers] = useState(false)
  const [speakersError, setSpeakersError] = useState<string | null>(null)
  const [selectedEventData, setSelectedEventData] = useState<any | null>(null)

  useEffect(() => {
    if (isLoaded) {
      setIsPageLoaded(true)
    }
  }, [isLoaded])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true)
        const fetchedEvents = await getPublicEvents()
        setEvents(fetchedEvents)

        const featuredEvent = fetchedEvents.find((event) => event.isFeatured === true)

        if (featuredEvent) {
          setSelectedEvent(featuredEvent._id)
          setSelectedEventData(featuredEvent)
          fetchProgramForEvent(featuredEvent._id)
          fetchSpeakersForEvent(featuredEvent._id)
        } else if (fetchedEvents.length > 0) {
          setSelectedEvent(fetchedEvents[0]._id)
          setSelectedEventData(fetchedEvents[0])
          fetchProgramForEvent(fetchedEvents[0]._id)
          fetchSpeakersForEvent(fetchedEvents[0]._id)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setIsLoadingEvents(false)
      }
    }

    fetchEvents()
  }, [])

  const fetchProgramForEvent = async (eventId: string) => {
    try {
      setLoadingProgram(true)
      const programData = await getPublicEventProgramByEventId(eventId)
      setCurrentProgram(programData)
    } catch (err) {
      console.error(`Error fetching program for event ${eventId}:`, err)
      setCurrentProgram(null)
    } finally {
      setLoadingProgram(false)
    }
  }

  const fetchSpeakersForEvent = async (eventId: string) => {
    try {
      setLoadingSpeakers(true)
      setSpeakersError(null)
      const speakersData = await getPublicSpeakersByEvent(eventId)
      setSpeakers(speakersData)
    } catch (err) {
      console.error(`Error fetching speakers for event ${eventId}:`, err)
      setSpeakers([])
      if (!isAuthenticated) {
        setSpeakersError("Inicia sesión para ver los ponentes de este evento")
      } else {
        setSpeakersError("No se pudieron cargar los ponentes para este evento")
      }
    } finally {
      setLoadingSpeakers(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleEventChange = async (eventId: string) => {
    setSelectedEvent(eventId)
    const event = events.find((event) => event._id === eventId)
    setSelectedEventData(event)
    fetchProgramForEvent(eventId)
    fetchSpeakersForEvent(eventId)
  }

  if (!isLoaded) return null

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <section className="py-12 px-4 md:px-8 bg-dark-gray">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl uppercase mb-4">{t.events?.title || "Eventos"}</h1>
          <p className="text-xl text-gray-light max-w-3xl mx-auto font-cormorant">
            {t.events?.subtitle || "Descubre nuestros próximos eventos y regístrate para participar en ellos."}
          </p>
        </div>
      </section>

      {/* Lista de Eventos */}
      <section className="py-8 px-4 md:px-8 bg-rich-black">
        <div className="max-w-7xl mx-auto">
          {isLoadingEvents ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
              <p className="mt-4">Cargando eventos...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="flex flex-wrap gap-4 justify-center">
              {events.map((event) => (
                <button
                  key={event._id}
                  onClick={() => handleEventChange(event._id)}
                  className={`px-6 py-2 transition-colors ${
                    selectedEvent === event._id
                      ? "bg-burgundy text-white"
                      : "bg-dark-gray text-white hover:bg-burgundy/20"
                  }`}
                >
                  {event.title}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p>No hay eventos disponibles.</p>
            </div>
          )}
        </div>
      </section>

      {selectedEventData ? (
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-[400px] md:h-[500px] overflow-hidden bg-dark-gray flex items-center justify-center">
                {selectedEventData.image ? (
                  <img
                    src={selectedEventData.image || "/placeholder.svg"}
                    alt={selectedEventData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-6xl text-gray-light/20">
                      {t.placeholder?.eventImage || "Imagen del evento"}
                    </div>
                    <div className="text-sm text-gray-light/50 mt-2">event.placeholder</div>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{selectedEventData.title}</h1>
                <div className="flex items-center text-gold mb-6">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>{formatDate(selectedEventData.date)}</span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-2 text-gold mt-1" />
                    <div>
                      <p className="font-medium">{t.preview?.location || "Ubicación"}</p>
                      <p className="text-gray-light">{selectedEventData.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-2 text-gold mt-1" />
                    <div>
                      <p className="font-medium">{t.common?.schedule || "Horario"}</p>
                      <p className="text-gray-light">{formatDate(selectedEventData.date)}</p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-light mb-8">{selectedEventData.description}</p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href={`/events/${selectedEventData._id}`}
                    className="bg-burgundy hover:bg-burgundy/90 text-white px-8 py-3 text-lg font-medium transition-colors inline-block"
                  >
                    {t.events?.viewDetails || "Ver detalles"}
                  </Link>
                  <Link
                    href={`/tickets?eventId=${selectedEventData._id}`}
                    className="bg-gold hover:bg-gold/90 text-rich-black px-8 py-3 text-lg font-medium transition-colors inline-block"
                  >
                    {t.events?.reserveTicket || "Reservar entrada"}
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Ponentes</h2>

              {loadingSpeakers ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-burgundy"></div>
                </div>
              ) : speakersError ? (
                <div className="bg-dark-gray p-8 rounded-lg">
                  {!isAuthenticated ? (
                    <div className="text-center">
                      <p className="text-gray-light mb-4">{speakersError}</p>
                      <Link
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          document.getElementById("login-button")?.click()
                        }}
                        className="inline-block px-6 py-2 bg-burgundy hover:bg-burgundy/90 text-white rounded-md transition-colors"
                      >
                        Iniciar sesión
                      </Link>
                    </div>
                  ) : (
                    <p className="text-gray-light text-center">{speakersError}</p>
                  )}
                </div>
              ) : speakers && speakers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {speakers.map((speaker) => (
                    <div key={speaker._id} className="bg-dark-gray p-6 rounded-lg flex flex-col items-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden mb-4 bg-gray-800 flex items-center justify-center">
                        {speaker.image ? (
                          <img
                            src={speaker.image || "/placeholder.svg"}
                            alt={speaker.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-16 w-16 text-gray-600" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-center mb-1">{speaker.name}</h3>
                      <p className="text-gold text-sm text-center mb-3">{speaker.position}</p>
                      {speaker.company && <p className="text-gray-light text-sm text-center mb-3">{speaker.company}</p>}
                      {speaker.bio && <p className="text-gray-light text-sm text-center line-clamp-3">{speaker.bio}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-dark-gray p-8 rounded-lg text-center">
                  <p className="text-gray-light">No hay ponentes registrados para este evento.</p>
                </div>
              )}
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Programa del evento</h2>

              {loadingProgram ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-burgundy"></div>
                </div>
              ) : currentProgram && currentProgram.days && currentProgram.days.length > 0 ? (
                <div className="space-y-6">
                  {currentProgram.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="bg-dark-gray p-6 rounded-lg">
                      <h4 className="font-bold text-gold mb-4 text-xl">
                        {new Date(day.date).toLocaleDateString("es-ES", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </h4>
                      <div className="space-y-4">
                        {day.sessions.map((session, sessionIndex) => (
                          <div key={sessionIndex} className="border-l-2 border-burgundy pl-4 py-2">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-lg">{session.title}</h5>
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
              ) : (
                <div className="bg-dark-gray p-8 rounded-lg text-center">
                  <p className="text-gray-light">El programa para este evento aún no está disponible.</p>
                </div>
              )}
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Detalles del evento</h2>
              <div className="bg-dark-gray p-8 rounded-lg">
                <p className="text-gray-light mb-4">{selectedEventData.description}</p>
                <p className="text-gray-light mb-4">
                  Este evento se realizará en {selectedEventData.location}. Asegúrate de reservar tu entrada con
                  anticipación.
                </p>
                <p className="text-gray-light mb-4">
                  Para más información, puedes contactar con nosotros a través de la sección de contacto.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : !isLoadingEvents && events.length === 0 ? (
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">No hay eventos disponibles</h2>
            <p className="text-gray-light mb-8">
              Actualmente no hay eventos programados. Por favor, vuelve a consultar más tarde.
            </p>
          </div>
        </section>
      ) : null}

      <Footer />
    </main>
  )
}
