import { API_CONFIG } from "@/utils/api-config"

// Interfaces para los datos del programa de eventos
export interface Session {
  title: string
  description?: string
  startTime?: string
  endTime?: string
}

export interface EventProgramDay {
  date: string
  sessions: Session[]
}

export interface EventProgram {
  _id: string
  eventId: string
  days: EventProgramDay[]
  createdAt?: string
  updatedAt?: string
}

// Obtener programa de evento por ID de evento (versión pública)
export async function getPublicEventProgramByEventId(eventId: string): Promise<EventProgram | null> {
  try {
    console.log(`Fetching public event program for event ID ${eventId}`)

    const response = await fetch(`${API_CONFIG.baseUrl}/event-program/event/${eventId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      // Si el servidor devuelve un error, manejarlo adecuadamente
      if (response.status === 404) {
        console.warn(`No program found for event ID ${eventId}`)
        return null
      }

      const errorText = await response.text()
      console.error(`Error response: ${response.status} - ${errorText}`)
      throw new Error(`Error fetching event program: ${response.status} - ${errorText}`)
    }

    // Verificar si la respuesta está vacía
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`Response is not JSON for event ID ${eventId}`)
      return null
    }

    // Verificar si hay contenido antes de intentar analizar como JSON
    const text = await response.text()
    if (!text || text.trim() === "") {
      console.warn(`Empty response for event ID ${eventId}`)
      return null
    }

    try {
      const data = JSON.parse(text)
      return data
    } catch (parseError) {
      console.error(`Error parsing JSON response: ${parseError}`)
      return null
    }
  } catch (error) {
    console.error(`Error in getPublicEventProgramByEventId for event ID ${eventId}:`, error)
    return null
  }
}

// Formatear la fecha para mostrar
export function formatProgramDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString
  }
}

// Formatear la hora para mostrar
export function formatTime(timeString?: string): string {
  if (!timeString) return ""
  return timeString
}
