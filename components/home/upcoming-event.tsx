"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import LoginModal from "@/components/auth/login-modal"
import { useRouter } from "next/navigation"
import { getPublicEvents, formatEventDate, type Event } from "@/services/public-event-service"

export default function UpcomingEvent() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedEvent = async () => {
      try {
        setIsLoading(true)
        const events = await getPublicEvents()
        const featured = events.find((event) => event.isFeatured)
        if (featured) {
          setFeaturedEvent(featured)
        }
      } catch (error) {
        console.error("Error fetching featured event:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedEvent()
  }, [])

  const handleLearnMoreClick = () => {
    // Show login modal with events page as redirect
    setIsLoginModalOpen(true)
  }

  return (
    <>
      <section className="py-24 px-4 md:px-8 bg-dark-gray">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title">Próximo evento</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] md:h-[500px] overflow-hidden bg-rich-black flex items-center justify-center">
              {isLoading ? (
                <div className="animate-pulse w-full h-full bg-rich-black/50"></div>
              ) : featuredEvent?.image ? (
                <img
                  src={featuredEvent.image || "/placeholder.svg"}
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="text-6xl text-gray-light/20">{t("placeholder.eventImage")}</div>
                  <div className="text-sm text-gray-light/50 mt-2">event.placeholder</div>
                </div>
              )}
              <div className="absolute top-4 left-4 border border-white/30 bg-transparent px-4 py-2">
                <p className="text-white font-cormorant tracking-wider uppercase">
                  {t("home.upcomingEvent.mainEvent")}
                </p>
              </div>
            </div>
            <div>
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 bg-rich-black/50 rounded w-3/4"></div>
                  <div className="h-6 bg-rich-black/50 rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-6 bg-rich-black/50 rounded"></div>
                    <div className="h-6 bg-rich-black/50 rounded"></div>
                    <div className="h-6 bg-rich-black/50 rounded"></div>
                  </div>
                  <div className="h-24 bg-rich-black/50 rounded"></div>
                  <div className="h-12 bg-rich-black/50 rounded w-1/3"></div>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl md:text-4xl font-cormorant font-light tracking-wider uppercase mb-4">
                    {featuredEvent?.title || t("home.upcomingEvent.eventTitle")}
                  </h2>
                  <div className="flex items-center text-gold mb-6">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span className="font-lato">
                      {featuredEvent ? formatEventDate(featuredEvent.date) : t("placeholder.date")}
                    </span>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 mr-2 text-gold mt-1" />
                      <p className="text-gray-light font-lato">
                        {featuredEvent?.location || t("placeholder.location")}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-light mb-8 font-lato">
                    {featuredEvent?.description || t("home.upcomingEvent.eventDescription")}
                  </p>

                  <button onClick={handleLearnMoreClick} className="btn btn-primary px-8 py-3">
                    Learn More
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Login Modal - will automatically redirect to preview page */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} redirectPath="/events" />
    </>
  )
}
