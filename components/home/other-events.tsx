"use client"

import { useState, useEffect, useRef } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import LoginModal from "@/components/auth/login-modal"
import { useRouter } from "next/navigation"
import { getPublicEvents, type Event, formatEventDate } from "@/services/public-event-service"

export default function OtherEvents() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [selectedEventPath, setSelectedEventPath] = useState<string | undefined>(undefined)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Número de eventos a mostrar a la vez (responsive)
  const getVisibleCount = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 1 // Mobile
      if (window.innerWidth < 1024) return 2 // Tablet
      return 3 // Desktop
    }
    return 3 // Default for SSR
  }

  const [visibleCount, setVisibleCount] = useState(3)

  // Actualizar visibleCount cuando cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount())
    }

    // Establecer el valor inicial
    setVisibleCount(getVisibleCount())

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const fetchedEvents = await getPublicEvents()
        setEvents(fetchedEvents)
      } catch (error) {
        console.error("Error fetching events for other events section:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const handleEventClick = (eventId: string) => {
    // Redirigir a la página de eventos con el ID del evento seleccionado
    setSelectedEventPath(`/events?event=${eventId}`)
    setIsLoginModalOpen(true)
  }

  // Navegar al siguiente conjunto de eventos
  const nextSlide = () => {
    if (events.length <= visibleCount) return

    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex + 1
      return newIndex >= events.length ? 0 : newIndex
    })
  }

  // Navegar al conjunto anterior de eventos
  const prevSlide = () => {
    if (events.length <= visibleCount) return

    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex - 1
      return newIndex < 0 ? Math.max(0, events.length - visibleCount) : newIndex
    })
  }

  // Calcular los eventos visibles actualmente
  const getVisibleEvents = () => {
    if (events.length <= visibleCount) {
      return events
    }

    const visibleEvents = []
    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % events.length
      visibleEvents.push(events[index])
    }
    return visibleEvents
  }

  // Renderizar eventos por defecto si no hay eventos de la API
  const renderDefaultEvents = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Default Event 1 */}
      <div className="card group cursor-pointer" onClick={() => handleEventClick("workshop")}>
        <div className="relative h-[250px] overflow-hidden bg-rich-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-light/20">{t("placeholder.eventImage")}</div>
            <div className="text-sm text-gray-light/50 mt-2">{t("placeholder.event")}</div>
          </div>
          <div className="absolute top-4 left-4 border border-gold/50 bg-transparent px-4 py-2">
            <p className="text-gold font-cormorant tracking-wider uppercase">{t("home.otherEvents.event.type")}</p>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-cormorant font-light tracking-wider uppercase mb-2">{t("placeholder.title")}</h3>
          <div className="flex items-center text-gold mb-4">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="font-lato">{t("placeholder.date")}</span>
          </div>
          <p className="text-gray-light mb-6 font-lato">{t("home.otherEvents.event.description")}</p>
          <button className="text-gold hover:text-gold/80 font-lato uppercase tracking-wider text-sm relative group">
            Saber más
            <span className="absolute left-0 bottom-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full"></span>
          </button>
        </div>
      </div>

      {/* Default Event 2 */}
      <div className="card group cursor-pointer" onClick={() => handleEventClick("masterclass")}>
        <div className="relative h-[250px] overflow-hidden bg-rich-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-light/20">{t("placeholder.eventImage")}</div>
            <div className="text-sm text-gray-light/50 mt-2">{t("placeholder.event")}</div>
          </div>
          <div className="absolute top-4 left-4 border border-gold/50 bg-transparent px-4 py-2">
            <p className="text-gold font-cormorant tracking-wider uppercase">{t("home.otherEvents.event.type")}</p>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-cormorant font-light tracking-wider uppercase mb-2">{t("placeholder.title")}</h3>
          <div className="flex items-center text-gold mb-4">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="font-lato">{t("placeholder.date")}</span>
          </div>
          <p className="text-gray-light mb-6 font-lato">{t("home.otherEvents.event.description")}</p>
          <button className="text-gold hover:text-gold/80 font-lato uppercase tracking-wider text-sm relative group">
            Saber más
            <span className="absolute left-0 bottom-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full"></span>
          </button>
        </div>
      </div>

      {/* Default Event 3 */}
      <div className="card group cursor-pointer" onClick={() => handleEventClick("symposium")}>
        <div className="relative h-[250px] overflow-hidden bg-rich-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-light/20">{t("placeholder.eventImage")}</div>
            <div className="text-sm text-gray-light/50 mt-2">{t("placeholder.event")}</div>
          </div>
          <div className="absolute top-4 left-4 border border-gold/50 bg-transparent px-4 py-2">
            <p className="text-gold font-cormorant tracking-wider uppercase">{t("home.otherEvents.event.type")}</p>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-cormorant font-light tracking-wider uppercase mb-2">{t("placeholder.title")}</h3>
          <div className="flex items-center text-gold mb-4">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="font-lato">{t("placeholder.date")}</span>
          </div>
          <p className="text-gray-light mb-6 font-lato">{t("home.otherEvents.event.description")}</p>
          <button className="text-gold hover:text-gold/80 font-lato uppercase tracking-wider text-sm relative group">
            Saber más
            <span className="absolute left-0 bottom-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full"></span>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title">Otros eventos</h2>
          <p className="text-center text-gray-light mb-12 max-w-3xl mx-auto">
            Descubre otros eventos presenciales que organizamos a lo largo del año
          </p>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
              <p className="mt-4">Cargando eventos...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="relative">
              {/* Controles de navegación */}
              {events.length > visibleCount && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 md:-ml-8 z-10 bg-rich-black/80 hover:bg-burgundy/80 text-white p-2 rounded-full transition-colors"
                    aria-label="Eventos anteriores"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 md:-mr-8 z-10 bg-rich-black/80 hover:bg-burgundy/80 text-white p-2 rounded-full transition-colors"
                    aria-label="Eventos siguientes"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Contenedor del carrusel */}
              <div ref={carouselRef} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-transform duration-500 ease-in-out">
                  {getVisibleEvents().map((event) => (
                    <div
                      key={event._id}
                      className="card group cursor-pointer transform transition-all duration-300 hover:scale-[1.02]"
                      onClick={() => handleEventClick(event._id)}
                    >
                      <div className="relative h-[250px] overflow-hidden bg-rich-black flex items-center justify-center">
                        {event.image ? (
                          <img
                            src={event.image || "/placeholder.svg"}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="text-4xl text-gray-light/20">{t("placeholder.eventImage")}</div>
                            <div className="text-sm text-gray-light/50 mt-2">{t("placeholder.event")}</div>
                          </div>
                        )}
                        <div className="absolute top-4 left-4 border border-gold/50 bg-transparent px-4 py-2">
                          <p className="text-gold font-cormorant tracking-wider uppercase">
                            {t("home.otherEvents.event.type")}
                          </p>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-cormorant font-light tracking-wider uppercase mb-2">
                          {event.title}
                        </h3>
                        <div className="flex items-center text-gold mb-4">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="font-lato">{formatEventDate(event.date)}</span>
                        </div>
                        <p className="text-gray-light mb-6 font-lato line-clamp-3">{event.description}</p>
                        <button className="text-gold hover:text-gold/80 font-lato uppercase tracking-wider text-sm relative group">
                          Saber más
                          <span className="absolute left-0 bottom-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full"></span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Indicadores de página */}
              {events.length > visibleCount && (
                <div className="flex justify-center mt-8 space-x-2">
                  {Array.from({ length: Math.ceil(events.length / visibleCount) }).map((_, index) => {
                    const isActive = index === Math.floor(currentIndex / visibleCount)
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index * visibleCount)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          isActive ? "w-6 bg-gold" : "bg-gray-light/50 hover:bg-gray-light"
                        }`}
                        aria-label={`Página ${index + 1}`}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            renderDefaultEvents()
          )}
        </div>
      </section>

      {/* Login Modal - will automatically redirect to the selected event path */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectPath={selectedEventPath}
      />
    </>
  )
}
