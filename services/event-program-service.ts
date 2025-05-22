import { API_CONFIG } from "@/utils/api-config"
import { get, post, del } from "@/utils/api"

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

export interface CreateEventProgramDto {
  eventId: string
  days: EventProgramDay[]
}

export interface UpdateEventProgramDto {
  eventId?: string
  days?: EventProgramDay[]
}

// Obtener todos los programas de eventos
export async function getAllEventPrograms(token: string): Promise<EventProgram[]> {
  try {
    return await get<EventProgram[]>(API_CONFIG.endpoints.eventPrograms, token)
  } catch (error) {
    console.error("Error fetching event programs:", error)
    throw error
  }
}

// Obtener programa de evento por ID
export async function getEventProgramById(id: string, token: string): Promise<EventProgram> {
  try {
    // El controlador no tiene una ruta específica para obtener por ID del programa
    // Obtenemos todos los programas y filtramos por ID
    const allPrograms = await get<EventProgram[]>(API_CONFIG.endpoints.eventPrograms, token)
    const program = allPrograms.find((prog) => prog._id === id)

    if (!program) {
      throw new Error(`No se encontró el programa con ID ${id}`)
    }

    return program
  } catch (error) {
    console.error(`Error fetching event program with ID ${id}:`, error)
    throw error
  }
}

// Obtener programa de evento por ID de evento
export async function getEventProgramByEventId(eventId: string, token: string): Promise<EventProgram | null> {
  try {
    const response = await get<EventProgram>(`${API_CONFIG.endpoints.eventPrograms}/event/${eventId}`, token)
    return response
  } catch (error) {
    console.error(`Error fetching event program for event ID ${eventId}:`, error)
    // En lugar de propagar el error, devolvemos null para indicar que no hay programa
    return null
  }
}

// Crear un nuevo programa de evento
export async function createEventProgram(programData: CreateEventProgramDto, token: string): Promise<EventProgram> {
  try {
    console.log("Token utilizado:", token ? "Token presente" : "Token ausente")
    console.log("Datos enviados:", programData)

    // Verificar que el token no esté vacío
    if (!token || token.trim() === "") {
      throw new Error("Token de autenticación inválido o vacío")
    }

    // Verificar que los datos sean válidos
    if (!programData.eventId || !programData.days || programData.days.length === 0) {
      throw new Error("Datos del programa incompletos")
    }

    return await post<EventProgram>(API_CONFIG.endpoints.eventPrograms, programData, token)
  } catch (error: any) {
    // Mejorar el mensaje de error para casos específicos
    if (error.message.includes("Unauthorized") || error.message.includes("401")) {
      console.error("Error de autenticación al crear programa:", error)
      throw new Error(
        "No tienes autorización para crear programas. Verifica que tu sesión sea válida y tengas permisos de administrador.",
      )
    }
    console.error("Error creating event program:", error)
    throw error
  }
}

// Actualizar un programa de evento
export async function updateEventProgram(
  id: string,
  programData: UpdateEventProgramDto,
  token: string,
): Promise<EventProgram> {
  try {
    // Verificar que el token es válido
    if (!token || token.trim() === "") {
      throw new Error("Token de autenticación inválido o vacío")
    }

    // Verificar que el ID es válido
    if (!id || id.trim() === "") {
      throw new Error("ID del programa inválido o vacío")
    }

    // Verificar que los datos no estén vacíos
    if (!programData || !programData.days || programData.days.length === 0) {
      throw new Error("Los datos del programa están vacíos o incompletos")
    }

    // Verificar que cada día tenga una fecha y al menos una sesión
    for (const day of programData.days) {
      if (!day.date) {
        throw new Error("Uno de los días no tiene fecha")
      }
      if (!day.sessions || day.sessions.length === 0) {
        throw new Error("Uno de los días no tiene sesiones")
      }
      // Verificar que cada sesión tenga un título
      for (const session of day.sessions) {
        if (!session.title) {
          throw new Error("Una de las sesiones no tiene título")
        }
      }
    }

    // Imprimir los datos que se van a enviar
    console.log("Actualizando programa con ID:", id)
    console.log("Datos enviados para actualización:", JSON.stringify(programData, null, 2))

    // Realizar la petición PATCH
    const endpoint = `${API_CONFIG.endpoints.eventPrograms}/${id}`
    console.log("Endpoint completo:", endpoint)

    // Usar directamente fetchApi para tener más control
    const baseUrl = API_CONFIG.baseUrl.endsWith("/") ? API_CONFIG.baseUrl.slice(0, -1) : API_CONFIG.baseUrl
    const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    console.log("URL completa:", url)
    console.log("Headers:", headers)

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(programData),
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error en la respuesta:", response.status, response.statusText)
      console.error("Cuerpo del error:", errorText)

      let errorMessage = `Error ${response.status}: ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorMessage
      } catch (e) {
        errorMessage = errorText || errorMessage
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("Respuesta exitosa:", data)
    return data
  } catch (error) {
    console.error(`Error updating event program with ID ${id}:`, error)
    throw error
  }
}

// Eliminar un programa de evento
export async function deleteEventProgram(id: string, token: string): Promise<{ message: string }> {
  try {
    return await del<{ message: string }>(`${API_CONFIG.endpoints.eventPrograms}/${id}`, token)
  } catch (error) {
    console.error(`Error deleting event program with ID ${id}:`, error)
    throw error
  }
}

// Formatear la fecha para mostrar
export function formatProgramDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Formatear la hora para mostrar
export function formatTime(timeString?: string): string {
  if (!timeString) return ""
  return timeString
}
