import { get, post, del, patch } from "@/utils/api"

// Interfaces for speaker data
export interface Speaker {
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

export interface CreateSpeakerDto {
  name: string
  position: string
  bio?: string
  image?: string
  company?: string
  eventId: string
}

export interface UpdateSpeakerDto {
  name?: string
  position?: string
  bio?: string
  image?: string
  company?: string
  eventId?: string
}

// Get all speakers
export async function getAllSpeakers(token: string): Promise<Speaker[]> {
  try {
    return await get<Speaker[]>("/speakers", token)
  } catch (error) {
    console.error("Error fetching speakers:", error)
    throw error
  }
}

// Get speakers by event ID
export async function getSpeakersByEvent(eventId: string, token: string): Promise<Speaker[]> {
  try {
    return await get<Speaker[]>(`/speakers/event/${eventId}`, token)
  } catch (error) {
    console.error(`Error fetching speakers for event ${eventId}:`, error)
    throw error
  }
}

// Get speaker by ID
export async function getSpeakerById(id: string, token: string): Promise<Speaker> {
  try {
    return await get<Speaker>(`/speakers/${id}`, token)
  } catch (error) {
    console.error(`Error fetching speaker with ID ${id}:`, error)
    throw error
  }
}

// Create a new speaker
export async function createSpeaker(speakerData: CreateSpeakerDto, token: string): Promise<Speaker> {
  try {
    return await post<Speaker>("/speakers", speakerData, token)
  } catch (error) {
    console.error("Error creating speaker:", error)
    throw error
  }
}

// Update a speaker
export async function updateSpeaker(id: string, speakerData: UpdateSpeakerDto, token: string): Promise<Speaker> {
  try {
    return await patch<Speaker>(`/speakers/${id}`, speakerData, token)
  } catch (error) {
    console.error(`Error updating speaker with ID ${id}:`, error)
    throw error
  }
}

// Delete a speaker
export async function deleteSpeaker(id: string, token: string): Promise<{ message: string }> {
  try {
    return await del<{ message: string }>(`/speakers/${id}`, token)
  } catch (error) {
    console.error(`Error deleting speaker with ID ${id}:`, error)
    throw error
  }
}
