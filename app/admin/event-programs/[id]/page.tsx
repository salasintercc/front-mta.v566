"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Edit, CalendarDays, Clock } from "lucide-react"
import { getEventProgramById, formatProgramDate, formatTime } from "@/services/event-program-service"
import type { EventProgram } from "@/services/event-program-service"
import { getEventById } from "@/services/event-service"
import type { Event } from "@/services/event-service"
import AuthGuard from "@/components/route-guards/auth-guard"

export default function EventProgramDetailsPage() {
  const params = useParams()
  const programId = params?.id as string

  const [program, setProgram] = useState<EventProgram | null>(null)
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

        // Obtener el programa
        const programData = await getEventProgramById(programId, token)
        setProgram(programData)

        // Obtener el evento asociado
        const eventData = await getEventById(programData.eventId, token)
        setEvent(eventData)
      } catch (err: any) {
        console.error("Error fetching program:", err)
        setError(err.message || "Error al cargar el programa del evento")
      } finally {
        setIsLoading(false)
      }
    }

    if (programId) {
      fetchData()
    }
  }, [programId])

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-rich-black text-white pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href="/admin/dashboard?tab=events"
                className="flex items-center text-gray-light hover:text-white mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Volver al panel</span>
              </Link>
              <h1 className="text-3xl font-bold">Detalles del Programa</h1>
              {event && (
                <p className="text-gray-light mt-1">
                  Evento: <span className="text-gold">{event.title}</span>
                </p>
              )}
            </div>
            {program && (
              <Link
                href={`/admin/event-programs/${programId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-burgundy hover:bg-burgundy/90 text-white rounded-md transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Editar Programa</span>
              </Link>
            )}
          </div>

          {error && (
            <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6">
              <p className="text-white">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
              <p className="mt-4 text-gray-light">Cargando programa...</p>
            </div>
          ) : program ? (
            <div className="space-y-8">
              <div className="bg-dark-gray p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-6">Programa del Evento</h2>

                {program.days.map((day, dayIndex) => (
                  <div key={dayIndex} className="mb-8 last:mb-0">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2 text-gold">
                      <CalendarDays className="h-5 w-5" />
                      <span>
                        Día {dayIndex + 1}: {formatProgramDate(day.date)}
                      </span>
                    </h3>

                    {day.sessions.length > 0 ? (
                      <div className="space-y-4 pl-6">
                        {day.sessions.map((session, sessionIndex) => (
                          <div key={sessionIndex} className="border-l-2 border-gray-700 pl-4 py-2">
                            <div className="flex items-start">
                              {(session.startTime || session.endTime) && (
                                <div className="flex items-center text-gray-400 text-sm mr-3 min-w-[100px]">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>
                                    {formatTime(session.startTime)}
                                    {session.startTime && session.endTime && " - "}
                                    {formatTime(session.endTime)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium">{session.title}</h4>
                                {session.description && (
                                  <p className="text-sm text-gray-400 mt-1">{session.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm pl-6">No hay sesiones programadas para este día</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-dark-gray rounded-lg">
              <h3 className="text-xl font-bold mb-2">Programa no encontrado</h3>
              <p className="text-gray-light mb-6">El programa que buscas no existe o ha sido eliminado.</p>
              <Link
                href="/admin/dashboard?tab=events"
                className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver al panel</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
