import { API_CONFIG } from "@/config/api"
import { get, post, patch, del } from "@/utils/api"
import { getCurrentUser } from "@/services/auth-service"

// Interfaces para los tickets
export interface Ticket {
  _id: string
  userId: string
  username: string
  eventId: string
  eventTitle: string
  eventDescription: string
  status: string
  type: "event" | "webinar"
  webinarId?: string
  createdAt: string
  updatedAt: string
  // Campos que se agregan en el backend
  eventDate?: string | Date
  eventLocation?: string
  webinarLink?: string
  eventImage?: string
  isFeatured?: boolean
}

// Modificar la interfaz CreateTicketRequest para incluir solo los campos necesarios
export interface CreateTicketRequest {
  userId: string
  username: string
  eventId?: string
  webinarId?: string
  type: "event" | "webinar"
  eventTitle: string
  eventDescription: string
}

// Obtener todos los tickets del usuario actual
export async function getUserTickets(): Promise<Ticket[]> {
  try {
    const user = getCurrentUser()
    if (!user || !user.id) {
      throw new Error("Usuario no autenticado o ID de usuario no disponible")
    }
    
    // Logs de diagnóstico
    console.log("Usuario actual:", user)
    const token = localStorage.getItem("token")
    console.log("Token actual:", token)

    // Usar la ruta definida en la configuración
    const endpoint = API_CONFIG.endpoints.userTickets(user.id)
    console.log("Endpoint usado:", endpoint)

    return await get<Ticket[]>(endpoint)
  } catch (error) {
    console.error("Error al obtener tickets del usuario:", error)
    throw error
  }
}

// Verificar si el usuario está registrado en un evento/webinar
export async function checkUserRegistration(contentId: string, type: "event" | "webinar"): Promise<boolean> {
  try {
    console.log(`Verificando registro para ${type} con ID: ${contentId}`);
    const tickets = await getUserTickets();
    console.log("Tickets del usuario:", tickets);
    
    const isRegistered = tickets.some((ticket) => {
      // Solo considerar tickets que no estén cancelados
      if (ticket.status === "cancelled") {
        console.log(`Ticket encontrado pero está cancelado:`, ticket);
        return false;
      }
      
      if (type === "event") {
        const matches = ticket.eventId === contentId && ticket.type === "event";
        if (matches) {
          console.log(`Usuario registrado en evento con ticket:`, ticket);
        }
        return matches;
      } else {
        const matches = ticket.webinarId === contentId && ticket.type === "webinar";
        if (matches) {
          console.log(`Usuario registrado en webinar con ticket:`, ticket);
        }
        return matches;
      }
    });

    console.log(`Estado de registro: ${isRegistered}`);
    return isRegistered;
  } catch (error) {
    console.error("Error al verificar registro del usuario:", error)
    return false
  }
}

// Obtener detalles de un ticket específico
export async function getTicketDetails(ticketId: string): Promise<Ticket> {
  try {
    const endpoint = typeof API_CONFIG.endpoints.ticketDetails === "function"
      ? API_CONFIG.endpoints.ticketDetails(ticketId)
      : `${API_CONFIG.endpoints.tickets}/${ticketId}`

    return await get<Ticket>(endpoint)
  } catch (error) {
    console.error(`Error al obtener detalles del ticket ${ticketId}:`, error)
    throw error
  }
}

// Crear un nuevo ticket
export async function createTicket(ticketData: CreateTicketRequest): Promise<Ticket> {
  try {
    const endpoint = typeof API_CONFIG.endpoints.reserveTicket === "function"
      ? API_CONFIG.endpoints.reserveTicket(ticketData.eventId || ticketData.webinarId || "")
      : API_CONFIG.endpoints.tickets

    return await post<Ticket>(endpoint, ticketData)
  } catch (error) {
    console.error("Error al crear ticket:", error)
    throw error
  }
}

// Actualizar el estado de un ticket
export async function updateTicketStatus(ticketId: string, status: string): Promise<Ticket> {
  try {
    return await patch<Ticket>(`${API_CONFIG.endpoints.tickets}/${ticketId}/status`, { status })
  } catch (error) {
    console.error(`Error al actualizar estado del ticket ${ticketId}:`, error)
    throw error
  }
}

// Cancelar un ticket
export async function cancelTicket(ticketId: string): Promise<Ticket> {
  try {
    const user = getCurrentUser();
    if (!user || !user.id) {
      throw new Error("Usuario no autenticado o ID de usuario no disponible");
    }

    return await post<Ticket>(`${API_CONFIG.endpoints.tickets}/cancel/${ticketId}`, { userId: user.id });
  } catch (error) {
    console.error(`Error al cancelar ticket ${ticketId}:`, error);
    throw error;
  }
}

// Eliminar un ticket
export async function deleteTicket(ticketId: string): Promise<void> {
  try {
    await del(`${API_CONFIG.endpoints.tickets}/${ticketId}`)
  } catch (error) {
    console.error(`Error al eliminar ticket ${ticketId}:`, error)
    throw error
  }
}

// Crear ticket con el usuario actual
export async function createTicketWithCurrentUser(
  eventId: string,
  title: string,
  description: string,
  type: "event" | "webinar" = "event",
): Promise<Ticket> {
  try {
    const user = getCurrentUser()
    if (!user || !user.id || !user.username) {
      throw new Error("Usuario no autenticado o información de usuario incompleta")
    }

    // Verificar registro existente
    const isRegistered = await checkUserRegistration(eventId, type)
    if (isRegistered) {
      return {
        _id: "existing-registration",
        userId: user.id,
        username: user.username,
        eventId: type === "event" ? eventId : "",
        webinarId: type === "webinar" ? eventId : undefined,
        eventTitle: title,
        eventDescription: description,
        status: "reserved",
        type: type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    const ticketData: CreateTicketRequest = {
      userId: user.id,
      username: user.username,
      eventTitle: title,
      eventDescription: description,
      type: type,
      ...(type === "event" ? { eventId } : { webinarId: eventId }),
    }

    return await createTicket(ticketData)
  } catch (error) {
    console.error("Error en createTicketWithCurrentUser:", error)
    throw error
  }
}
