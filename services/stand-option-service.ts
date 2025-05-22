import { get, post, patch, del } from "@/utils/api"

// Interfaces for stand option data
export interface StandOption {
  _id: string
  title: string
  description?: string
  event: string
  items: StandItem[]
  createdAt?: string
  updatedAt?: string
}

export interface StandOptionItem {
  _id: string
  label: string
  imageUrl?: string
  price: number
  description?: string
}

export interface StandItem {
  _id: string
  label: string
  type: "text" | "image" | "select" | "upload"
  required: boolean
  maxSelections?: number
  inputPlaceholder?: string
  showImage?: boolean
  options?: StandOptionItem[]
  description?: string
}

export interface CreateStandOptionDto {
  title: string
  description?: string
  event: string
  items: StandItem[]
}

export interface UpdateStandOptionDto {
  title?: string
  description?: string
  event?: string
  items?: StandItem[]
}

// Get all stand options
export async function getAllStandOptions(): Promise<StandOption[]> {
  try {
    console.log("Fetching all stand options")
    return await get<StandOption[]>("/stand-options")
  } catch (error) {
    console.error("Error fetching stand options:", error)
    return [] // Return empty array instead of throwing
  }
}

// Get stand option by ID
export async function getStandOptionById(id: string): Promise<StandOption> {
  try {
    return await get<StandOption>(`/stand-options/${id}`)
  } catch (error) {
    console.error(`Error fetching stand option with ID ${id}:`, error)
    throw error
  }
}

// Get stand options by event (filtering by event ID)
export async function getStandOptionsByEvent(eventId: string): Promise<StandOption[]> {
  try {
    console.log(`Fetching stand options for event ${eventId}`)
    // Primero intentamos obtener directamente del endpoint si existe
    try {
      return await get<StandOption[]>(`/stand-options/event/${eventId}`)
    } catch (directError) {
      console.log("Direct endpoint not available, filtering client-side")
      // Si no existe el endpoint específico, filtramos del lado del cliente
      const allOptions = await getAllStandOptions()
      return allOptions.filter((option) => option.event === eventId)
    }
  } catch (error) {
    console.error(`Error fetching stand options for event ${eventId}:`, error)
    return [] // Return empty array instead of throwing
  }
}

// Create a new stand option
export async function createStandOption(standOptionData: CreateStandOptionDto): Promise<StandOption> {
  try {
    return await post<StandOption>("/stand-options", standOptionData)
  } catch (error) {
    console.error("Error creating stand option:", error)
    throw error
  }
}

// Update a stand option
export async function updateStandOption(id: string, standOptionData: UpdateStandOptionDto): Promise<StandOption> {
  try {
    return await patch<StandOption>(`/stand-options/${id}`, standOptionData)
  } catch (error) {
    console.error(`Error updating stand option with ID ${id}:`, error)
    throw error
  }
}

// Delete a stand option
export async function deleteStandOption(id: string): Promise<{ message: string }> {
  try {
    return await del<{ message: string }>(`/stand-options/${id}`)
  } catch (error) {
    console.error(`Error deleting stand option with ID ${id}:`, error)
    throw error
  }
}
