import { get, post, patch, del } from "@/utils/api"
import { API_CONFIG } from "@/config/api"

// Interfaces para los tipos de tickets
export interface TicketType {
  _id: string
  name: string
  price: number
  stock: number
  benefits?: string[]
  eventId: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateTicketTypeDto {
  name: string
  price: number
  stock: number
  benefits?: string[]
  eventId: string
}

export interface UpdateTicketTypeDto {
  name?: string
  price?: number
  stock?: number
  benefits?: string[]
  eventId?: string
}

// Obtener todos los tipos de tickets (endpoint público)
export async function getAllTicketTypes(): Promise<TicketType[]> {
  try {
    return await get<TicketType[]>(API_CONFIG.endpoints.ticketTypes)
  } catch (error) {
    console.error("Error fetching ticket types:", error)
    throw error
  }
}

// Obtener tipos de tickets por evento (endpoint público)
export async function getTicketTypesByEvent(eventId: string): Promise<TicketType[]> {
  try {
    return await get<TicketType[]>(`${API_CONFIG.endpoints.ticketTypes}/event/${eventId}`)
  } catch (error) {
    console.error(`Error fetching ticket types for event ${eventId}:`, error)
    throw error
  }
}

// Obtener un tipo de ticket por ID (endpoint público)
export async function getTicketTypeById(id: string): Promise<TicketType> {
  try {
    return await get<TicketType>(`${API_CONFIG.endpoints.ticketTypes}/${id}`)
  } catch (error) {
    console.error(`Error fetching ticket type with ID ${id}:`, error)
    throw error
  }
}

// Crear un nuevo tipo de ticket (requiere autenticación)
export async function createTicketType(ticketTypeData: CreateTicketTypeDto): Promise<TicketType> {
  try {
    return await post<TicketType>(API_CONFIG.endpoints.ticketTypes, ticketTypeData)
  } catch (error) {
    console.error("Error creating ticket type:", error)
    throw error
  }
}

// Actualizar un tipo de ticket (requiere autenticación)
export async function updateTicketType(
  id: string,
  ticketTypeData: UpdateTicketTypeDto,
): Promise<TicketType> {
  try {
    return await patch<TicketType>(`${API_CONFIG.endpoints.ticketTypes}/${id}`, ticketTypeData)
  } catch (error) {
    console.error(`Error updating ticket type with ID ${id}:`, error)
    throw error
  }
}

// Eliminar un tipo de ticket (requiere autenticación)
export async function deleteTicketType(id: string): Promise<{ message: string }> {
  try {
    return await del<{ message: string }>(`${API_CONFIG.endpoints.ticketTypes}/${id}`)
  } catch (error) {
    console.error(`Error deleting ticket type with ID ${id}:`, error)
    throw error
  }
}
