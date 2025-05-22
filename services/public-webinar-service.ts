import { API_CONFIG } from "@/config/api"
import { get } from "@/utils/api"

// Interfaces for webinar data
export interface Webinar {
  _id: string
  title: string
  description: string
  date: Date | string
  link?: string
  image?: string
  isFeatured: boolean
  createdAt?: string
  updatedAt?: string
}

// Get all webinars - public endpoint, no token required
export async function getPublicWebinars(): Promise<Webinar[]> {
  try {
    return await get<Webinar[]>(API_CONFIG.endpoints.webinars)
  } catch (error) {
    console.error("Error in getPublicWebinars:", error)
    throw error
  }
}

// Get webinar by ID - public endpoint, no token required
export async function getPublicWebinarById(id: string): Promise<Webinar> {
  try {
    return await get<Webinar>(`${API_CONFIG.endpoints.webinars}/${id}`)
  } catch (error) {
    console.error(`Error in getPublicWebinarById for ID ${id}:`, error)
    throw error
  }
}

// Get all featured webinars - public endpoint, no token required
export async function getPublicFeaturedWebinars(): Promise<Webinar[]> {
  try {
    return await get<Webinar[]>(`${API_CONFIG.endpoints.webinars}/featured`)
  } catch (error) {
    console.error("Error in getPublicFeaturedWebinars:", error)
    throw error
  }
}

// Format date for display
export function formatWebinarDate(dateString: string | Date): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return String(dateString)
  }
}
