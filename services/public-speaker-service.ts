import { API_CONFIG } from "@/utils/api-config"

// Interfaces for speaker data
export interface PublicSpeaker {
  _id: string
  name: string
  position: string
  bio?: string
  image?: string
  company?: string
  eventId: string
  createdAt?: string
  updatedAt?: string
}

// Get all speakers - public endpoint, no token required
export async function getPublicSpeakers(): Promise<PublicSpeaker[]> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/speakers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Error fetching public speakers:", errorData)
      throw new Error(errorData.message || "Error al obtener ponentes")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error in getPublicSpeakers:", error)
    throw error
  }
}

// Get speakers by event ID - requires authentication
export async function getPublicSpeakersByEvent(eventId: string): Promise<PublicSpeaker[]> {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/speakers/event/${eventId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Error fetching public speakers for event ${eventId}:`, errorData)
      throw new Error(errorData.message || "Error al obtener ponentes del evento")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error in getPublicSpeakersByEvent for event ${eventId}:`, error)
    throw error
  }
}

// Get speaker by ID - requires authentication
export async function getPublicSpeakerById(id: string): Promise<PublicSpeaker> {
  try {
    // Get the token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/speakers/${id}`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Error fetching public speaker with ID ${id}:`, errorData)
      throw new Error(errorData.message || "Error al obtener ponente")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error in getPublicSpeakerById for ID ${id}:`, error)
    throw error
  }
}
