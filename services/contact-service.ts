import { API_CONFIG } from "@/utils/api-config"

// Interfaces para los datos de contacto
export interface ContactFormData {
  name: string
  email: string
  subject?: string
  inquiryType?: string
  message: string
  cargo?: string
  empresa?: string
}

export interface TicketReservationData {
  name: string
  email: string
  ticketEvent: string
  ticketQuantity: number
  message?: string
  cargo?: string
  empresa?: string
}

// Enviar un mensaje de contacto
export async function sendContactMessage(contactData: ContactFormData): Promise<{ message: string }> {
  try {
    // Log para depuración
    console.log("API URL:", API_CONFIG.baseUrl)
    console.log("Contact endpoint:", API_CONFIG.endpoints.contactConsult)

    // Verificar que las URLs estén definidas
    if (!API_CONFIG.baseUrl) {
      console.error("API base URL is undefined")
      throw new Error("Error de configuración: URL de API no definida")
    }

    if (!API_CONFIG.endpoints.contactConsult) {
      console.error("Contact endpoint is undefined")
      throw new Error("Error de configuración: Endpoint de contacto no definido")
    }

    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.contactConsult}`
    console.log("Full URL:", url)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Error sending contact message:", errorData)
      throw new Error(errorData.message || "Error al enviar el mensaje de contacto")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error in sendContactMessage:", error)
    throw error
  }
}

// Reservar un ticket (requiere autenticación)
export async function reserveTicket(
  reservationData: TicketReservationData,
  token: string,
): Promise<{ message: string; reservation: any }> {
  try {
    // Verificar que las URLs estén definidas
    if (!API_CONFIG.baseUrl || !API_CONFIG.endpoints.contactReserveTicket) {
      console.error("API configuration error:", {
        baseUrl: API_CONFIG.baseUrl,
        endpoint: API_CONFIG.endpoints.contactReserveTicket,
      })
      throw new Error("Error de configuración: URL de API o endpoint no definidos")
    }

    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.contactReserveTicket}`
    console.log("Reserve ticket URL:", url)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reservationData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Error reserving ticket:", errorData)
      throw new Error(errorData.message || "Error al reservar el ticket")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error in reserveTicket:", error)
    throw error
  }
}
