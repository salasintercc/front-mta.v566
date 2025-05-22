import { API_CONFIG } from "@/config/api"
import { get } from "@/utils/api"

// Interfaces for event data
export interface Event {
  _id: string
  title: string
  description: string
  date: Date | string
  location: string
  image?: string
  isFeatured: boolean
  createdAt?: string
  updatedAt?: string
}

// Get event by ID - public endpoint, no token required
export async function getPublicEventById(id: string): Promise<Event> {
  try {
    return await get<Event>(`${API_CONFIG.endpoints.events}/${id}`)
  } catch (error) {
    console.error(`Error in getPublicEventById for ID ${id}:`, error)
    throw error
  }
}

// Get all events - public endpoint, no token required
export async function getPublicEvents(): Promise<Event[]> {
  try {
    return await get<Event[]>(API_CONFIG.endpoints.events)
  } catch (error) {
    console.error("Error in getPublicEvents:", error)
    throw error
  }
}

// Get all featured events - public endpoint, no token required
export async function getPublicFeaturedEvents(): Promise<Event[]> {
  try {
    return await get<Event[]>(`${API_CONFIG.endpoints.events}/featured`)
  } catch (error) {
    console.error("Error in getPublicFeaturedEvents:", error)
    throw error
  }
}

// Format date for display
export function formatEventDate(dateString: string | Date): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return String(dateString)
  }
}
