"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import LoginModal from "@/components/auth/login-modal"
import { useRouter } from "next/navigation"
import { getPublicEvents, type Event, formatEventDate } from "@/services/public-event-service"

interface SlideProps {
  categoryKey: string
  titleKey: string
  subtitleKey: string
}

export default function FeaturedEventsSlider() {
  const { t } = useLanguage()
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [autoplay, setAutoplay] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const fetchedEvents = await getPublicEvents()
        setEvents(fetchedEvents)
      } catch (error) {
        console.error("Error fetching events for slider:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Generic slides data as fallback
  const defaultSlides: SlideProps[] = [
    {
      categoryKey: "slides.categories.main",
      titleKey: "common.siteTitle",
      subtitleKey: "placeholder.description",
    },
    {
      categoryKey: "slides.categories.workshop",
      titleKey: "common.siteTitle",
      subtitleKey: "placeholder.description",
    },
    {
      categoryKey: "slides.categories.masterclass",
      titleKey: "common.siteTitle",
      subtitleKey: "placeholder.description",
    },
  ]

  // Use real events if available, otherwise use default slides
  const slides =
    events.length > 0
      ? events.map((event) => ({
          id: event._id,
          title: event.title,
          description: event.description,
          date: formatEventDate(event.date),
          location: event.location,
          image: event.image,
        }))
      : defaultSlides

  // Handle next/previous slide
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
    setAutoplay(false) // Pause autoplay when manually changing slides
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
    setAutoplay(false) // Pause autoplay when manually changing slides
  }

  // Autoplay functionality
  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
    }, 5000)

    return () => clearInterval(interval)
  }, [autoplay, slides.length])

  // Reset autoplay after 10 seconds of inactivity
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAutoplay(true)
    }, 10000)

    return () => clearTimeout(timeout)
  }, [autoplay])

  // Handle learn more button click - show login modal
  const handleLearnMoreClick = () => {
    // Show login modal with events page as redirect
    setIsLoginModalOpen(true)
  }

  return (
    <>
      <section className="relative h-screen w-full overflow-hidden">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="absolute inset-0 bg-rich-black flex items-center justify-center">
              {slide.image ? (
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-black/50 z-10"></div>
                  <img
                    src={slide.image || "/placeholder.svg"}
                    alt={slide.title || t("placeholder.heroImage")}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-8xl text-gray-light/20">{t("placeholder.heroImage")}</div>
                  <div className="text-sm text-gray-light/50 mt-2">slide.placeholder</div>
                </div>
              )}
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-20">
              {/* Removing the category label box */}

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-cormorant font-light tracking-widest uppercase mb-6">
                Meet the Architect
              </h1>

              <p className="text-xl md:text-2xl font-cormorant tracking-wider uppercase mb-12 max-w-3xl">
                El evento de arquitectura más exclusivo de 2025
              </p>

              {/* Add date, description, location placeholders */}
              <div className="mb-8 space-y-2 text-center">
                <p className="text-gold font-cormorant tracking-wider uppercase">
                  {events.length > 0 ? slide.date : t("placeholder.date")}
                </p>
                <p className="text-white font-cormorant tracking-wider uppercase">
                  {events.length > 0 ? slide.location : t("placeholder.location")}
                </p>
              </div>

              <button onClick={handleLearnMoreClick} className="btn btn-primary px-12 py-4 text-lg">
                Saber más
              </button>
            </div>
          </div>
        ))}

        {/* Slider Controls */}
        <div className="absolute bottom-8 right-8 flex space-x-4 z-20">
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="border border-white/30 hover:border-gold bg-transparent p-3 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="border border-white/30 hover:border-gold bg-transparent p-3 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-0 right-0">
          <div className="flex justify-center space-x-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlide(index)
                  setAutoplay(false)
                }}
                className={`w-12 h-px transition-all duration-300 ${currentSlide === index ? "bg-gold w-24" : "bg-white/50"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Login Modal - will automatically redirect to events page */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} redirectPath="/events" />
    </>
  )
}
