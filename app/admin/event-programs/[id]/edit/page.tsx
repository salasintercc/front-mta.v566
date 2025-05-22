"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { CalendarDays, Clock, Plus, Trash2, ArrowLeft, Save } from "lucide-react"
import { getEventProgramById, updateEventProgram } from "@/services/event-program-service"
import { getAllEvents } from "@/services/event-service"
import type { Event } from "@/services/event-service"
import AuthGuard from "@/components/route-guards/auth-guard"

export default function EditEventProgramPage() {
  const router = useRouter()
  const params = useParams()
  const programId = params?.id as string

  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState<{
    eventId: string
    days: {
      date: string
      sessions: {
        title: string
        description?: string
        startTime?: string
        endTime?: string
      }[]
    }[]
  }>({
    eventId: "",
    days: [
      {
        date: "",
        sessions: [
          {
            title: "",
            description: "",
            startTime: "",
            endTime: "",
          },
        ],
      },
    ],
  })

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

        // Obtener la lista de eventos
        const eventsData = await getAllEvents(token)
        setEvents(eventsData)

        // Formatear las fechas para el input date
        const formattedDays = programData.days.map((day) => ({
          ...day,
          date: formatDateForInput(day.date),
        }))

        // Establecer los datos del formulario
        setFormData({
          eventId: programData.eventId,
          days: formattedDays,
        })
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Error al cargar los datos del programa")
      } finally {
        setIsLoading(false)
      }
    }

    if (programId) {
      fetchData()
    }
  }, [programId])

  // Función para formatear la fecha para el input date (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  const handleDayChange = (index: number, field: string, value: string) => {
    const updatedDays = [...formData.days]
    updatedDays[index] = {
      ...updatedDays[index],
      [field]: value,
    }
    setFormData({
      ...formData,
      days: updatedDays,
    })
  }

  const handleSessionChange = (dayIndex: number, sessionIndex: number, field: string, value: string) => {
    const updatedDays = [...formData.days]
    updatedDays[dayIndex].sessions[sessionIndex] = {
      ...updatedDays[dayIndex].sessions[sessionIndex],
      [field]: value,
    }
    setFormData({
      ...formData,
      days: updatedDays,
    })
  }

  const addDay = () => {
    setFormData({
      ...formData,
      days: [
        ...formData.days,
        {
          date: "",
          sessions: [
            {
              title: "",
              description: "",
              startTime: "",
              endTime: "",
            },
          ],
        },
      ],
    })
  }

  const removeDay = (index: number) => {
    const updatedDays = [...formData.days]
    updatedDays.splice(index, 1)
    setFormData({
      ...formData,
      days: updatedDays,
    })
  }

  const addSession = (dayIndex: number) => {
    const updatedDays = [...formData.days]
    updatedDays[dayIndex].sessions.push({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
    })
    setFormData({
      ...formData,
      days: updatedDays,
    })
  }

  const removeSession = (dayIndex: number, sessionIndex: number) => {
    const updatedDays = [...formData.days]
    updatedDays[dayIndex].sessions.splice(sessionIndex, 1)
    setFormData({
      ...formData,
      days: updatedDays,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Validación básica
    for (let i = 0; i < formData.days.length; i++) {
      if (!formData.days[i].date) {
        setError(`Por favor, establece una fecha para el día ${i + 1}`)
        return
      }

      for (let j = 0; j < formData.days[i].sessions.length; j++) {
        if (!formData.days[i].sessions[j].title) {
          setError(`Por favor, establece un título para la sesión ${j + 1} del día ${i + 1}`)
          return
        }
      }
    }

    try {
      setIsSaving(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Preparar los datos para la actualización
      // Asegurarse de que las fechas estén en formato ISO para el backend
      const formattedDays = formData.days.map((day) => ({
        date: new Date(day.date).toISOString(),
        sessions: day.sessions.map((session) => ({
          title: session.title,
          description: session.description || "",
          startTime: session.startTime || "",
          endTime: session.endTime || "",
        })),
      }))

      // Crear el objeto de actualización exactamente como lo espera el backend
      const updateData = {
        days: formattedDays,
      }

      console.log("Datos a enviar:", JSON.stringify(updateData, null, 2))

      // Intentar actualizar el programa
      await updateEventProgram(programId, updateData, token)

      setSuccessMessage("Programa actualizado correctamente")

      // Redirigir después de un breve retraso
      setTimeout(() => {
        router.push("/admin/dashboard?tab=programs")
      }, 2000)
    } catch (err: any) {
      console.error("Error updating event program:", err)
      setError(err.message || "Error al actualizar el programa del evento")
    } finally {
      setIsSaving(false)
    }
  }

  const getEventName = (eventId: string) => {
    const event = events.find((e) => e._id === eventId)
    return event ? event.title : "Evento desconocido"
  }

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
              <h1 className="text-3xl font-bold">Editar Programa de Evento</h1>
              {!isLoading && (
                <p className="text-gray-light mt-1">
                  Evento: <span className="text-gold">{getEventName(formData.eventId)}</span>
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6">
              <p className="text-white">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-900/20 border border-green-500 p-4 rounded-md mb-6">
              <p className="text-white">{successMessage}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
              <p className="mt-4 text-gray-light">Cargando programa...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-dark-gray p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Días del Programa</h2>
                  <button
                    type="button"
                    onClick={addDay}
                    className="flex items-center gap-1 px-3 py-1.5 bg-burgundy hover:bg-burgundy/90 text-white rounded-md transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Añadir Día</span>
                  </button>
                </div>

                {formData.days.map((day, dayIndex) => (
                  <div key={dayIndex} className="mb-8 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-gold" />
                        <span>Día {dayIndex + 1}</span>
                      </h3>
                      {formData.days.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDay(dayIndex)}
                          className="flex items-center gap-1 px-2 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-md transition-colors text-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Eliminar Día</span>
                        </button>
                      )}
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor={`day-${dayIndex}-date`}
                        className="block text-sm font-medium text-gray-light mb-1"
                      >
                        Fecha
                      </label>
                      <input
                        type="date"
                        id={`day-${dayIndex}-date`}
                        value={day.date}
                        onChange={(e) => handleDayChange(dayIndex, "date", e.target.value)}
                        className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-md font-medium">Sesiones</h4>
                        <button
                          type="button"
                          onClick={() => addSession(dayIndex)}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Añadir Sesión</span>
                        </button>
                      </div>

                      {day.sessions.map((session, sessionIndex) => (
                        <div key={sessionIndex} className="border-l-2 border-gray-700 pl-4 py-2">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gold" />
                              <span>Sesión {sessionIndex + 1}</span>
                            </h5>
                            {day.sessions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSession(dayIndex, sessionIndex)}
                                className="flex items-center gap-1 px-2 py-1 text-red-500 hover:bg-red-900/20 rounded-md transition-colors text-xs"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Eliminar</span>
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label
                                htmlFor={`session-${dayIndex}-${sessionIndex}-startTime`}
                                className="block text-sm font-medium text-gray-light mb-1"
                              >
                                Hora de inicio
                              </label>
                              <input
                                type="time"
                                id={`session-${dayIndex}-${sessionIndex}-startTime`}
                                value={session.startTime || ""}
                                onChange={(e) =>
                                  handleSessionChange(dayIndex, sessionIndex, "startTime", e.target.value)
                                }
                                className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`session-${dayIndex}-${sessionIndex}-endTime`}
                                className="block text-sm font-medium text-gray-light mb-1"
                              >
                                Hora de fin
                              </label>
                              <input
                                type="time"
                                id={`session-${dayIndex}-${sessionIndex}-endTime`}
                                value={session.endTime || ""}
                                onChange={(e) => handleSessionChange(dayIndex, sessionIndex, "endTime", e.target.value)}
                                className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label
                                htmlFor={`session-${dayIndex}-${sessionIndex}-title`}
                                className="block text-sm font-medium text-gray-light mb-1"
                              >
                                Título de la sesión
                              </label>
                              <input
                                type="text"
                                id={`session-${dayIndex}-${sessionIndex}-title`}
                                value={session.title}
                                onChange={(e) => handleSessionChange(dayIndex, sessionIndex, "title", e.target.value)}
                                className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                                required
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`session-${dayIndex}-${sessionIndex}-description`}
                                className="block text-sm font-medium text-gray-light mb-1"
                              >
                                Descripción (opcional)
                              </label>
                              <textarea
                                id={`session-${dayIndex}-${sessionIndex}-description`}
                                value={session.description || ""}
                                onChange={(e) =>
                                  handleSessionChange(dayIndex, sessionIndex, "description", e.target.value)
                                }
                                className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-4">
                <Link
                  href="/admin/dashboard?tab=events"
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2 bg-burgundy hover:bg-burgundy/90 text-white rounded-md transition-colors flex items-center gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Actualizar Programa</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
