"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CalendarDays, Clock, Edit, Plus, Trash2, Eye } from "lucide-react"
import {
  getAllEventPrograms,
  getEventProgramByEventId,
  deleteEventProgram,
  formatProgramDate,
  formatTime,
  type EventProgram,
} from "@/services/event-program-service"
import { getAllEvents } from "@/services/event-service"
import type { Event } from "@/services/event-service"

interface EventProgramManagerProps {
  eventId?: string
}

export default function EventProgramManager({ eventId }: EventProgramManagerProps) {
  const router = useRouter()
  const [programs, setPrograms] = useState<EventProgram[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [programToDelete, setProgramToDelete] = useState<EventProgram | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || "all")

  const fetchPrograms = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      let programsData: EventProgram[] = []

      if (selectedEventId && selectedEventId !== "all") {
        try {
          const program = await getEventProgramByEventId(selectedEventId, token)
          programsData = program ? [program] : []
        } catch (error) {
          console.error("No program found for this event:", error)
          programsData = []
        }
      } else {
        programsData = await getAllEventPrograms(token)
      }

      setPrograms(programsData)

      // Fetch events for dropdown
      const eventsData = await getAllEvents(token)
      setEvents(eventsData)
    } catch (err: any) {
      console.error("Error fetching programs:", err)
      setError(err.message || "Error al cargar los programas")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrograms()
  }, [selectedEventId])

  const handleDeleteProgram = async () => {
    if (!programToDelete) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await deleteEventProgram(programToDelete._id, token)

      // Actualizar la lista de programas
      setPrograms(programs.filter((program) => program._id !== programToDelete._id))
      setSuccessMessage("Programa eliminado correctamente")
      setIsDeleteModalOpen(false)
      setProgramToDelete(null)

      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (err: any) {
      console.error("Error deleting program:", err)
      setError(err.message || "Error al eliminar el programa")
    }
  }

  const getEventName = (eventId: string) => {
    const event = events.find((e) => e._id === eventId)
    return event ? event.title : "Evento desconocido"
  }

  const handleCreateProgram = () => {
    if (selectedEventId && selectedEventId !== "all") {
      router.push(`/admin/event-programs/new?eventId=${selectedEventId}`)
    } else {
      router.push("/admin/event-programs/new")
    }
  }

  return (
    <div>
      {error && (
        <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-4">
          <p className="text-white">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-900/20 border border-green-500 p-4 rounded-md mb-4">
          <p className="text-white">{successMessage}</p>
        </div>
      )}

      {/* Filtro por evento */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="w-full md:w-1/2">
          <label htmlFor="eventFilter" className="block text-sm font-medium text-gray-light mb-2">
            Filtrar por evento
          </label>
          <select
            id="eventFilter"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="all">Todos los eventos</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleCreateProgram}
          className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Crear Programa</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
          <p className="mt-4 text-gray-light">Cargando programas...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {programs.length > 0 ? (
            programs.map((program) => (
              <div
                key={program._id}
                className="bg-dark-gray p-4 rounded-lg border border-transparent hover:border-gold/30 transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Programa: {getEventName(program.eventId)}</h3>
                    <p className="text-gray-light text-sm">
                      {program.days.length} {program.days.length === 1 ? "día" : "días"} programados
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3 md:mt-0">
                    <Link
                      href={`/admin/event-programs/${program._id}/edit`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </Link>
                    <button
                      onClick={() => {
                        setProgramToDelete(program)
                        setIsDeleteModalOpen(true)
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500 rounded-md transition-colors text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar</span>
                    </button>
                    <Link
                      href={`/events/${program.eventId}#program`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-gold/50 hover:bg-gold/10 text-gold rounded-md transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver</span>
                    </Link>
                  </div>
                </div>

                <div className="space-y-4 mt-4">
                  {program.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="bg-rich-black p-3 rounded-md">
                      <h4 className="text-md font-medium mb-2 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gold" />
                        <span>
                          Día {dayIndex + 1}: {formatProgramDate(day.date)}
                        </span>
                      </h4>

                      {day.sessions.length > 0 ? (
                        <div className="space-y-2 pl-6">
                          {day.sessions.map((session, sessionIndex) => (
                            <div key={sessionIndex} className="border-l-2 border-gray-700 pl-3 py-1">
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
                                  <h5 className="font-medium">{session.title}</h5>
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
            ))
          ) : (
            <div className="text-center py-12 bg-dark-gray rounded-lg">
              <CalendarDays className="h-12 w-12 mx-auto text-gray-light mb-4" />
              <h3 className="text-xl font-bold mb-2">No hay programas</h3>
              <p className="text-gray-light mb-6">
                {selectedEventId && selectedEventId !== "all"
                  ? "No hay programa para este evento."
                  : "No se encontraron programas de eventos."}
              </p>
              <button
                onClick={handleCreateProgram}
                className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Crear primer programa</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {isDeleteModalOpen && programToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-gray rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmar eliminación</h3>
            <p className="mb-6">
              ¿Estás seguro de que deseas eliminar el programa para el evento "{getEventName(programToDelete.eventId)}"?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProgram}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
