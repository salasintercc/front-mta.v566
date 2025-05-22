"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import CookieConsent from "@/components/cookie-consent"
import Footer from "@/components/footer"
import LoadingScreen from "@/components/loading-screen"
import { useLanguage } from "@/contexts/language-context"
import FeaturedEventsSlider from "@/components/home/featured-eventsslider"
import UpcomingEvent from "@/components/home/upcoming-event"
import LoginModal from "@/components/auth/login-modal"
import { useAuth } from "@/contexts/auth-context"
import dynamic from "next/dynamic"
import { getPublicEvents, type Event } from "@/services/public-event-service"
import type { Speaker } from "@/services/speaker-service"
import { getPublicSpeakersByEvent } from "@/services/public-speaker-service"
import {
  getPublicEventProgramByEventId,
  type EventProgram,
  type Session,
  formatProgramDate,
} from "@/services/public-event-program-service"

// Cargar componentes pesados de forma dinámica
const DynamicOtherEvents = dynamic(() => import("@/components/home/other-events"), {
  loading: () => (
    <div className="py-24 px-4 md:px-8 bg-dark-gray">
      <div className="max-w-7xl mx-auto text-center">Cargando eventos...</div>
    </div>
  ),
  ssr: true,
})

export default function Home() {
  const { t, isLoaded } = useLanguage()
  const { isAuthenticated } = useAuth()
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isFullProgramVisible, setIsFullProgramVisible] = useState(false)
  const [isProgramLoginModalOpen, setIsProgramLoginModalOpen] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null)
  const [featuredSpeakers, setFeaturedSpeakers] = useState<Speaker[]>([])
  const [isLoadingSpeakers, setIsLoadingSpeakers] = useState(false)
  const [eventProgram, setEventProgram] = useState<EventProgram | null>(null)
  const [isLoadingProgram, setIsLoadingProgram] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetchedEvents = await getPublicEvents()
        setEvents(fetchedEvents)

        // Find the featured event
        const featured = fetchedEvents.find((event) => event.isFeatured)
        if (featured) {
          setFeaturedEvent(featured)

          // Fetch speakers for the featured event
          fetchSpeakersForEvent(featured._id)

          // Fetch program for the featured event
          fetchProgramForEvent(featured._id)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      }
    }

    fetchEvents()
  }, [])

  const fetchSpeakersForEvent = async (eventId: string) => {
    try {
      setIsLoadingSpeakers(true)
      // Usar el servicio público que no requiere token
      const speakers = await getPublicSpeakersByEvent(eventId)
      setFeaturedSpeakers(speakers)
    } catch (error) {
      console.error("Error fetching speakers for featured event:", error)
      setFeaturedSpeakers([]) // Establecer un array vacío en caso de error
    } finally {
      setIsLoadingSpeakers(false)
    }
  }

  const fetchProgramForEvent = async (eventId: string) => {
    try {
      setIsLoadingProgram(true)
      const program = await getPublicEventProgramByEventId(eventId)
      setEventProgram(program)
    } catch (error) {
      console.error("Error fetching program for featured event:", error)
      setEventProgram(null)
    } finally {
      setIsLoadingProgram(false)
    }
  }

  useEffect(() => {
    if (isLoaded) {
      setIsPageLoaded(true)
    }

    // Si el usuario está autenticado, mostrar el programa completo
    if (isAuthenticated) {
      setIsFullProgramVisible(true)
    }
  }, [isLoaded, isAuthenticated])

  // Función para manejar el clic en "Ver más" del programa
  const handleProgramViewMore = () => {
    if (isAuthenticated) {
      // Si ya está autenticado, simplemente mostrar el programa completo
      setIsFullProgramVisible(true)
    } else {
      // Si no está autenticado, mostrar el modal de login
      setIsProgramLoginModalOpen(true)
    }
  }

  if (!isPageLoaded) {
    return <LoadingScreen />
  }

  // Función para renderizar las sesiones de un día del programa
  const renderProgramSessions = (sessions: Session[]) => {
    return sessions.map((session, index) => (
      <li key={index} className="border-l border-burgundy pl-4">
        {session.startTime && (
          <p className="text-gray-light font-lato">
            {session.startTime} {session.endTime ? `- ${session.endTime}` : ""}
          </p>
        )}
        <h4 className="text-lg font-cormorant font-light tracking-wider uppercase mb-1">{session.title}</h4>
        {session.description && <p className="text-gray-light font-lato">{session.description}</p>}
      </li>
    ))
  }

  return (
    <main className="min-h-screen bg-rich-black text-white">
      <Navbar />

      {/* Hero Section with Slideshow */}
      <FeaturedEventsSlider />

      {/* Upcoming Event Overview */}
      <UpcomingEvent />

      {/* Featured Speakers Section */}
      <section className="py-24 px-4 md:px-8 bg-dark-gray">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title">Ponentes destacados</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingSpeakers
              ? // Loading state
                [1, 2, 3].map((index) => (
                  <div key={index} className="card group animate-pulse">
                    <div className="relative h-[400px] overflow-hidden bg-dark-gray/50"></div>
                    <div className="p-6">
                      <div className="h-6 bg-dark-gray/50 rounded mb-2"></div>
                      <div className="h-4 bg-dark-gray/50 rounded w-2/3 mb-4"></div>
                      <div className="h-16 bg-dark-gray/50 rounded"></div>
                    </div>
                  </div>
                ))
              : featuredSpeakers.length > 0
                ? // Display speakers from the featured event
                  featuredSpeakers.map((speaker, index) => (
                    <div key={speaker._id} className="card group">
                      <div className="relative h-[400px] overflow-hidden bg-dark-gray flex items-center justify-center">
                        {speaker.image ? (
                          <img
                            src={speaker.image || "/placeholder.svg"}
                            alt={speaker.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="text-6xl text-gray-light/20">{t("placeholder.speakerImage")}</div>
                            <div className="text-sm text-gray-light/50 mt-2">speaker.placeholder</div>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-cormorant font-light tracking-wider uppercase mb-1">
                          {speaker.name}
                        </h3>
                        <p className="text-gold mb-2 font-lato">{speaker.position}</p>
                        <p className="text-gray-light font-lato">{speaker.bio || t("home.speakers.description1")}</p>
                        {speaker.company && <p className="text-gray-light font-lato mt-2">{speaker.company}</p>}
                      </div>
                    </div>
                  ))
                : // Fallback to default speakers if no featured speakers found
                  [
                    {
                      name: "Lorem Ipsum",
                      role: "Lorem Ipsum Dolor",
                      image: "/placeholder.svg?height=400&width=400&text=Speaker+1",
                      descKey: "home.speakers.description1",
                    },
                    {
                      name: "Lorem Ipsum",
                      role: "Lorem Ipsum Dolor",
                      image: "/placeholder.svg?height=400&width=400&text=Speaker+2",
                      descKey: "home.speakers.description1",
                    },
                    {
                      name: "Lorem Ipsum",
                      role: "Lorem Ipsum Dolor",
                      image: "/placeholder.svg?height=400&width=400&text=Speaker+3",
                      descKey: "home.speakers.description1",
                    },
                  ].map((speaker, index) => (
                    <div key={index} className="card group">
                      <div className="relative h-[400px] overflow-hidden bg-dark-gray flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl text-gray-light/20">{t("placeholder.speakerImage")}</div>
                          <div className="text-sm text-gray-light/50 mt-2">speaker.placeholder</div>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-cormorant font-light tracking-wider uppercase mb-1">
                          {speaker.name}
                        </h3>
                        <p className="text-gold mb-2 font-lato">{speaker.role}</p>
                        <p className="text-gray-light font-lato">{t(speaker.descKey)}</p>
                      </div>
                    </div>
                  ))}
          </div>

          <div className="text-center mt-12">
            <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-secondary px-8 py-3">
              View all speakers
            </button>
          </div>
        </div>
      </section>

      {/* Program Highlights with parte oculta */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <h2 className="section-title">Programa</h2>

        {isLoadingProgram ? (
          // Estado de carga para el programa
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
            <p className="mt-4">Cargando programa...</p>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-8 program-preview ${isFullProgramVisible ? "full-program-visible" : ""}`}
          >
            {eventProgram && eventProgram.days.length > 0 ? (
              // Mostrar programa real del evento destacado
              <>
                {eventProgram.days.slice(0, isFullProgramVisible ? eventProgram.days.length : 2).map((day, index) => (
                  <div key={index} className="card p-8">
                    <h3 className="text-gold text-xl font-cormorant font-light tracking-wider uppercase mb-4">
                      {formatProgramDate(day.date)}
                    </h3>
                    <ul className="space-y-6">{renderProgramSessions(day.sessions)}</ul>
                  </div>
                ))}
              </>
            ) : (
              // Mostrar programa de ejemplo si no hay programa real
              <>
                <div className="card p-8">
                  <h3 className="text-gold text-xl font-cormorant font-light tracking-wider uppercase mb-4">
                    {t("placeholder.date")}
                  </h3>
                  <ul className="space-y-6">
                    {[1, 2, 3].map((num) => (
                      <li key={num} className="border-l border-burgundy pl-4">
                        <p className="text-gray-light font-lato">{t("placeholder.time")}</p>
                        <h4 className="text-lg font-cormorant font-light tracking-wider uppercase mb-1">
                          Lorem ipsum dolor sit amet
                        </h4>
                        <p className="text-gray-light font-lato">{t("placeholder.speaker")}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card p-8">
                  <h3 className="text-gold text-xl font-cormorant font-light tracking-wider uppercase mb-4">
                    {t("placeholder.date")}
                  </h3>
                  <ul className="space-y-6">
                    {[1, 2, 3].map((num) => (
                      <li key={num} className="border-l border-burgundy pl-4">
                        <p className="text-gray-light font-lato">{t("placeholder.time")}</p>
                        <h4 className="text-lg font-cormorant font-light tracking-wider uppercase mb-1">
                          Lorem ipsum dolor sit amet
                        </h4>
                        <p className="text-gray-light font-lato">{t("placeholder.speaker")}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Contenido adicional que se muestra cuando isFullProgramVisible es true */}
            {!isFullProgramVisible && eventProgram && eventProgram.days.length > 2 && (
              <div className="program-overlay">
                <p className="text-white text-lg mb-4 text-center max-w-md font-lato">
                  Regístrate para ver el programa completo
                </p>
                <button onClick={handleProgramViewMore} className="btn btn-primary px-8 py-3">
                  See more
                </button>
              </div>
            )}

            {/* Overlay para ocultar parte del programa - solo se muestra cuando isFullProgramVisible es false */}
            {!isFullProgramVisible && (!eventProgram || eventProgram.days.length <= 2) && (
              <div className="program-overlay">
                <p className="text-white text-lg mb-4 text-center max-w-md font-lato">
                  Regístrate para ver el programa completo
                </p>
                <button onClick={handleProgramViewMore} className="btn btn-primary px-8 py-3">
                  See more
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botón "Saber más del evento" que aparece cuando el programa completo está visible */}
        {isFullProgramVisible && (
          <div className="text-center mt-12">
            <Link href="/events" className="btn btn-secondary px-8 py-3">
              Learn more about the event
            </Link>
          </div>
        )}
      </section>

      {/* Get Your Ticket Now CTA */}
      <section className="py-24 px-4 md:px-8 bg-burgundy/80">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-cormorant font-light tracking-wider uppercase mb-6">
            Reserva tu entrada ahora
          </h2>
          <p className="text-xl mb-8 font-lato">
            No te pierdas el evento arquitectónico más importante del año. Reserva tu entrada hoy.
          </p>
          <Link href="/tickets" className="btn btn-gold px-12 py-4 text-lg">
            Book now
          </Link>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="relative h-[400px] md:h-[500px] overflow-hidden bg-dark-gray flex items-center justify-center">
            {featuredEvent?.image ? (
              <img src={featuredEvent.image || "/placeholder.svg"} alt="Venue" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-6xl text-gray-light/20">{t("placeholder.venueImage")}</div>
                <div className="text-sm text-gray-light/50 mt-2">location.placeholder</div>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-cormorant font-light tracking-wider uppercase mb-6">Ubicación</h2>
            <h3 className="text-gold text-xl font-cormorant font-light tracking-wider uppercase mb-4">
              {featuredEvent?.location || "Marx Halle Wien"}
            </h3>
            <div className="mb-8"></div>
            <Link
              href={`https://maps.google.com/?q=${encodeURIComponent(featuredEvent?.location || "Marx Halle Wien")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary px-8 py-3"
            >
              Ver en el mapa
            </Link>
          </div>
        </div>
      </section>

      {/* Other Events Section */}
      <DynamicOtherEvents />

      <Footer />
      <CookieConsent />

      {/* Login Modal para el programa */}
      <LoginModal
        isOpen={isProgramLoginModalOpen}
        onClose={() => {
          setIsProgramLoginModalOpen(false)
          setIsFullProgramVisible(true) // Mostrar el programa completo al cerrar el modal
        }}
      />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} redirectPath="/events" />
    </main>
  )
}
