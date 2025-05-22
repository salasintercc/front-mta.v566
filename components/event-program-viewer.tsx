"use client"

import { useState, useEffect } from "react"
import { getPublicEventProgramByEventId, type EventProgram } from "@/services/public-event-program-service"

interface EventProgramViewerProps {
  eventId?: string
  program?: EventProgram
}

export default function EventProgramViewer({ eventId, program: initialProgram }: EventProgramViewerProps) {
  const [program, setProgram] = useState<EventProgram | null>(initialProgram || null)
  const [isLoading, setIsLoading] = useState(!initialProgram && !!eventId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Si ya tenemos un programa o no tenemos un eventId, no hacemos nada
    if (initialProgram || !eventId) return

    async function fetchProgram() {
      try {
        setIsLoading(true)
        const programData = await getPublicEventProgramByEventId(eventId)
        setProgram(programData)
        setError(null)
      } catch (err) {
        console.error("Error fetching event program:", err)
        setError("Error al cargar el programa del evento")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgram()
  }, [eventId, initialProgram])

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-burgundy border-r-transparent"></div>
        <p className="mt-2 text-gray-light">Cargando programa...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-light">{error}</p>
      </div>
    )
  }

  if (!program || !program.days || program.days.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-light">No hay programa disponible para este evento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {program.days.map((day, dayIndex) => (
        <div key={dayIndex} className="bg-rich-black p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-gold">
            {new Date(day.date).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
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
  )
}
