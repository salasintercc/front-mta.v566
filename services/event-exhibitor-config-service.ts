import { get, post } from "@/utils/api"

export interface ExhibitorConfig {
  _id: string
  user: {
    _id: string
    username: string
    email: string
    fullName?: string
    company?: string
  }
  event: {
    _id: string
    title: string
  }
  isEnabled: boolean
  isStandConfigEnabled: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Obtiene la lista de exhibitors habilitados para un evento específico
 */
export async function getEnabledExhibitorsForEvent(eventId: string): Promise<ExhibitorConfig[]> {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    const response = await get<ExhibitorConfig[]>(`/event-exhibitor-config/${eventId}/enabled-users`)
    return response || []
  } catch (error) {
    console.error("Error fetching enabled exhibitors:", error)
    throw error
  }
}

/**
 * Habilita a un exhibitor para configurar su stand en un evento
 * Esta función establece tanto isEnabled como isStandConfigEnabled a true
 */
export async function enableExhibitorStandConfig(userId: string, eventId: string): Promise<ExhibitorConfig> {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    console.log(`Habilitando exhibitor ${userId} para el evento ${eventId}`)
    console.log("Se establecerán isEnabled=true e isStandConfigEnabled=true")

    const response = await post<ExhibitorConfig>(`/event-exhibitor-config/${eventId}/enable/${userId}`, {})

    // Verificar que ambos campos estén habilitados
    if (!response.isEnabled || !response.isStandConfigEnabled) {
      console.warn("Advertencia: Uno o ambos campos de habilitación no están activados en la respuesta")
      console.warn(`isEnabled: ${response.isEnabled}, isStandConfigEnabled: ${response.isStandConfigEnabled}`)
    }

    return response
  } catch (error) {
    console.error("Error enabling exhibitor stand config:", error)
    throw error
  }
}

/**
 * Deshabilita a un exhibitor para configurar su stand en un evento
 * Esta función establece isStandConfigEnabled a false
 */
export async function disableExhibitorStandConfig(userId: string, eventId: string): Promise<ExhibitorConfig> {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    console.log(`Deshabilitando exhibitor ${userId} para el evento ${eventId}`)
    console.log("Se establecerá isStandConfigEnabled=false")

    const response = await post<ExhibitorConfig>(`/event-exhibitor-config/${eventId}/disable/${userId}`, {})
    return response
  } catch (error) {
    console.error("Error disabling exhibitor stand config:", error)
    throw error
  }
}

/**
 * Verifica si un exhibitor tiene acceso a configurar su stand para un evento
 */
export async function checkExhibitorAccess(
  eventId: string,
): Promise<{ hasAccess: boolean; isStandConfigEnabled: boolean }> {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    const response = await get<{ hasAccess: boolean; isStandConfigEnabled: boolean }>(
      `/event-exhibitor-config/${eventId}/check-access`,
    )
    return response
  } catch (error) {
    console.error(`Error checking exhibitor access for event ${eventId}:`, error)
    return { hasAccess: false, isStandConfigEnabled: false }
  }
}

// Asegurarse de que las funciones coincidan con los endpoints del backend
/**
 * Obtiene todos los eventos habilitados para un exhibitor específico
 * SOLUCIÓN MEJORADA: Envía el ID del usuario explícitamente
 */
export async function getEnabledEventsForExhibitor(): Promise<any[]> {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    // Obtener el ID del usuario del localStorage o de donde esté almacenado
    const userInfo = localStorage.getItem("userInfo")
    let userId = null

    if (userInfo) {
      try {
        const parsedUserInfo = JSON.parse(userInfo)
        userId = parsedUserInfo._id || parsedUserInfo.id
        console.log("ID de usuario extraído del localStorage:", userId)
      } catch (e) {
        console.error("Error al parsear userInfo:", e)
      }
    }

    // Si no se pudo obtener del localStorage, intentar obtenerlo del token JWT
    if (!userId) {
      try {
        // Decodificar el token JWT para obtener el ID del usuario
        const tokenParts = token.split(".")
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]))
          userId = payload.sub || payload.id || payload._id
          console.log("ID de usuario extraído del token JWT:", userId)
        }
      } catch (e) {
        console.error("Error al decodificar el token JWT:", e)
      }
    }

    if (!userId) {
      console.error("No se pudo obtener el ID del usuario")
      return []
    }

    console.log(`Obteniendo eventos habilitados para el exhibitor con ID: ${userId}`)

    // Enviar el ID del usuario explícitamente como parámetro de consulta
    // Asegurarse de que coincida con el endpoint del backend
    const response = await get<any[]>(`/event-exhibitor-config/user?userId=${userId}`)
    console.log("Respuesta del endpoint /event-exhibitor-config/user:", response)

    // Si no hay respuesta o es un array vacío, devolver array vacío
    if (!response || !Array.isArray(response) || response.length === 0) {
      console.log("No se encontraron configuraciones para el usuario")
      return []
    }

    // Analizar la estructura de la respuesta
    console.log("Estructura de la primera configuración:", JSON.stringify(response[0], null, 2))

    // Verificar si las configuraciones tienen el campo 'event' como objeto
    if (response[0].event && typeof response[0].event === "object") {
      console.log("Las configuraciones tienen el campo 'event' como objeto")

      // Extraer los eventos de las configuraciones
      const events = response
        .filter((config) => config.isStandConfigEnabled === true)
        .map((config) => {
          return {
            ...config.event,
            isEnabled: config.isEnabled,
            isStandConfigEnabled: config.isStandConfigEnabled,
          }
        })
        .filter(Boolean)

      console.log(`Se encontraron ${events.length} eventos habilitados:`, events)
      return events
    }
    // Si event es un string (ID), necesitamos obtener los detalles de los eventos
    else if (response[0].event && typeof response[0].event === "string") {
      console.log("Las configuraciones tienen el campo 'event' como string (ID)")

      // Obtener todos los eventos para poder enriquecerlos
      const allEvents = await get<any[]>(`/events`)
      console.log(`Se obtuvieron ${allEvents.length} eventos en total`)

      // Extraer los IDs de eventos habilitados
      const enabledEventIds = response
        .filter((config) => config.isStandConfigEnabled === true)
        .map((config) => config.event)

      console.log("IDs de eventos habilitados:", enabledEventIds)

      // Filtrar los eventos según los IDs habilitados
      const enabledEvents = allEvents.filter((event) => enabledEventIds.includes(event._id))
      console.log(`Se encontraron ${enabledEvents.length} eventos habilitados para el usuario`)

      // Añadir los campos de habilitación a cada evento
      return enabledEvents.map((event) => {
        const config = response.find((c) => c.event === event._id)
        return {
          ...event,
          isEnabled: config?.isEnabled || false,
          isStandConfigEnabled: config?.isStandConfigEnabled || false,
        }
      })
    }

    // Si la estructura no es la esperada, devolver array vacío
    console.log("La estructura de la respuesta no es la esperada")
    return []
  } catch (error: any) {
    console.error("Error al obtener eventos habilitados:", error)
    console.log("Error detallado:", error.message)
    console.log("Devolviendo array vacío debido al error")
    return []
  }
}

/**
 * Obtiene todos los exhibitors (usuarios con rol exhibitor)
 * Actualizado para usar role en lugar de userType
 */
export async function getAllExhibitors(): Promise<any[]> {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    // Obtenemos todos los usuarios
    const response = await get<any[]>(`/users`)

    if (!response) return []

    // Filtramos para obtener solo los usuarios con role: "exhibitor"
    const exhibitors = response.filter((user) => user.role === "exhibitor")

    // Como respaldo, también incluimos usuarios con userType: "exhibitor" pero sin role: "exhibitor"
    // Esto es para asegurar la compatibilidad durante la transición
    const legacyExhibitors = response.filter((user) => user.userType === "exhibitor" && user.role !== "exhibitor")

    // Combinamos ambos conjuntos y eliminamos duplicados
    const allExhibitors = [...exhibitors, ...legacyExhibitors]
    const uniqueExhibitors = allExhibitors.filter(
      (user, index, self) => index === self.findIndex((u) => u._id === user._id),
    )

    console.log(
      `Se encontraron ${uniqueExhibitors.length} exhibitors (${exhibitors.length} por role, ${legacyExhibitors.length} por userType)`,
    )

    return uniqueExhibitors
  } catch (error) {
    console.error("Error fetching exhibitors:", error)
    return []
  }
}

// Asegurarse de que las funciones coincidan con los endpoints del backend
/**
 * Verifica directamente si un usuario tiene acceso a un evento específico
 * Esta es una función de diagnóstico para verificar problemas
 */
export async function checkDirectAccess(userId: string, eventId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    // Intentar obtener la configuración directamente
    // Asegurarse de que coincida con el endpoint del backend
    const response = await get<any>(`/event-exhibitor-config/direct-check?userId=${userId}&eventId=${eventId}`)

    console.log("Respuesta de verificación directa:", response)

    return response && response.hasAccess === true
  } catch (error) {
    console.error("Error checking direct access:", error)
    return false
  }
}

/**
 * Crea una configuración de exhibitor para un evento específico
 * Esta función es para uso administrativo
 */
export async function createExhibitorConfig(userId: string, eventId: string): Promise<any> {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    console.log(`Creando configuración para exhibitor ${userId} en evento ${eventId}`)

    const response = await post<any>(`/event-exhibitor-config/create`, {
      userId,
      eventId,
      isEnabled: true,
      isStandConfigEnabled: true,
    })

    return response
  } catch (error) {
    console.error("Error creating exhibitor config:", error)
    throw error
  }
}
