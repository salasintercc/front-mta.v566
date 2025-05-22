import { API_CONFIG } from "@/utils/api-config"
import { get, post, del, patch } from "@/utils/api"

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

export interface CreateEventDto {
  title: string
  description: string
  date: Date | string
  location: string
  image?: string
  isFeatured?: boolean
}

export interface UpdateEventDto {
  title?: string
  description?: string
  date?: Date | string
  location?: string
  image?: string
  isFeatured?: boolean
}

// Get all events
export async function getAllEvents(token: string): Promise<Event[]> {
  try {
    return await get<Event[]>(API_CONFIG.endpoints.events, token)
  } catch (error) {
    console.error("Error fetching events:", error)
    throw error
  }
}

// Get event by ID
export async function getEventById(id: string, token: string): Promise<Event> {
  try {
    return await get<Event>(`${API_CONFIG.endpoints.events}/${id}`, token)
  } catch (error) {
    console.error(`Error fetching event with ID ${id}:`, error)
    throw error
  }
}

// Create a new event
export async function createEvent(eventData: CreateEventDto, token: string): Promise<Event> {
  try {
    return await post<Event>(API_CONFIG.endpoints.events, eventData, token)
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

// Update an event
export async function updateEvent(id: string, eventData: UpdateEventDto, token: string): Promise<Event> {
  try {
    return await patch<Event>(`${API_CONFIG.endpoints.events}/${id}`, eventData, token)
  } catch (error) {
    console.error(`Error updating event with ID ${id}:`, error)
    throw error
  }
}

// Delete an event
export async function deleteEvent(id: string, token: string): Promise<{ message: string }> {
  try {
    return await del<{ message: string }>(`${API_CONFIG.endpoints.events}/${id}`, token)
  } catch (error) {
    console.error(`Error deleting event with ID ${id}:`, error)
    throw error
  }
}
