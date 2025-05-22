import { API_CONFIG } from "@/config/api"
import { get, post, patch, del } from "@/utils/api"

// Interfaces para webinar data
export interface Webinar {
  _id: string
  title: string
  description: string
  date: Date | string
  link: string
  image?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateWebinarDto {
  title: string
  description: string
  date: Date | string
  link: string
  image?: string
}

export interface UpdateWebinarDto {
  title?: string
  description?: string
  date?: Date | string
  link?: string
  image?: string
}

// Get all webinars
export async function getAllWebinars(token?: string): Promise<Webinar[]> {
  try {
    console.log("Fetching webinars from:", API_CONFIG.endpoints.webinars)
    return await get<Webinar[]>(API_CONFIG.endpoints.webinars, token)
  } catch (error) {
    console.error("Error fetching webinars:", error)
    throw error
  }
}

// Get webinar by ID
export async function getWebinarById(id: string, token?: string): Promise<Webinar> {
  try {
    return await get<Webinar>(`${API_CONFIG.endpoints.webinars}/${id}`, token)
  } catch (error) {
    console.error(`Error fetching webinar with ID ${id}:`, error)
    throw error
  }
}

// Create a new webinar
export async function createWebinar(webinarData: CreateWebinarDto, token: string): Promise<Webinar> {
  try {
    return await post<Webinar>(API_CONFIG.endpoints.webinars, webinarData, token)
  } catch (error) {
    console.error("Error creating webinar:", error)
    throw error
  }
}

// Update a webinar
export async function updateWebinar(id: string, webinarData: UpdateWebinarDto, token: string): Promise<Webinar> {
  try {
    return await patch<Webinar>(`${API_CONFIG.endpoints.webinars}/${id}`, webinarData, token)
  } catch (error) {
    console.error(`Error updating webinar with ID ${id}:`, error)
    throw error
  }
}

// Delete a webinar
// Modificar la función deleteWebinar para usar del en lugar de deleteRequest
export async function deleteWebinar(id: string, token: string): Promise<{ message: string }> {
  try {
    return await del<{ message: string }>(`${API_CONFIG.endpoints.webinars}/${id}`, token)
  } catch (error) {
    console.error(`Error deleting webinar with ID ${id}:`, error)
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
