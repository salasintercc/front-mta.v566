"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"
import { getPublicEventProgramByEventId, type EventProgram } from "@/services/public-event-program-service"
import { getPublicFeaturedEvents } from "@/services/public-event-service"

export default function ProgramSection() {
  const { t } = useLanguage()
  const [program, setProgram] = useState<EventProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [featuredEventId, setFeaturedEventId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeaturedEventAndProgram() {
      try {
        setLoading(true)
        // Obtener eventos destacados
        const featuredEvents = await getPublicFeaturedEvents()

        if (featuredEvents && featuredEvents.length > 0) {
          const eventId = featuredEvents[0]._id
          setFeaturedEventId(eventId)

          // Obtener el programa del evento destacado
          const eventProgram = await getPublicEventProgramByEventId(eventId)
          setProgram(eventProgram)
        } else {
          setError("No se encontraron eventos destacados")
        }
      } catch (err) {
        console.error("Error fetching featured event program:", err)
        setError("Error al cargar el programa del evento")
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedEventAndProgram()
  }, [])

  return (
    <section className="py-16 md:py-24 bg-rich-black">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">{t.home.program.title}</h2>
          <p className="text-gray-light text-lg">{t.home.program.subtitle}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-burgundy"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-gray-light">{error}</p>
          </div>
        ) : !program ? (
          <div className="text-center py-8">
            <p className="text-gray-light">{t.home.program.notAvailable}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {program.days.slice(0, 2).map((day, dayIndex) => (
              <div key={dayIndex} className="bg-dark-gray p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4 text-gold">
                  {new Date(day.date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>
                <div className="space-y-4">
                  {day.sessions.slice(0, 3).map((session, sessionIndex) => (
                    <div key={sessionIndex} className="border-l-2 border-burgundy pl-4 py-2">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-white">{session.title}</h4>
                        {session.startTime && (
                          <span className="text-sm text-gold">
                            {session.startTime} {session.endTime && `- ${session.endTime}`}
                          </span>
                        )}
                      </div>
                      {session.description && <p className="text-gray-light text-sm">{session.description}</p>}
                    </div>
                  ))}
                  {day.sessions.length > 3 && (
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-light">{t.home.program.moreSessions}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          {featuredEventId ? (
            <Link
              href={`/events/${featuredEventId}`}
              className="inline-block px-6 py-3 bg-burgundy hover:bg-burgundy/90 text-white font-medium rounded-md transition-colors"
            >
              {t.home.program.viewFullProgram}
            </Link>
          ) : (
            <Link
              href="/events"
              className="inline-block px-6 py-3 bg-burgundy hover:bg-burgundy/90 text-white font-medium rounded-md transition-colors"
            >
              {t.home.program.viewEvents}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
