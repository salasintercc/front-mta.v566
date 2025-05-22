import { API_CONFIG } from "@/config/api"

// Generic GET request
export async function get<T>(endpoint: string): Promise<T> {
  try {
    const token = localStorage.getItem("token")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Normalize the endpoint to ensure it starts with a slash
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

    // Normalize the base URL to ensure it doesn't end with a slash
    const baseUrl = API_CONFIG.baseUrl.endsWith("/") ? API_CONFIG.baseUrl.slice(0, -1) : API_CONFIG.baseUrl

    const url = `${baseUrl}${normalizedEndpoint}`
    console.log(`Making GET request to: ${url}`)

    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    })

    // Special handling for 404 errors when fetching stand configurations
    // Return null directly without throwing an error or logging to console
    if (response.status === 404 && endpoint.includes("/stand-config/")) {
      console.log(`No configuration found for ${endpoint} (expected for new options)`)
      return null as unknown as T
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error response from ${url}:`, errorText)
      throw new Error(`Cannot ${response.statusText} ${endpoint}`)
    }

    // Check if the response is empty
    const text = await response.text()
    if (!text) {
      console.log(`Empty response from ${url}`)
      return null as unknown as T
    }

    try {
      // Try to parse the response as JSON
      return JSON.parse(text)
    } catch (parseError) {
      console.error(`Error parsing JSON response from ${url}:`, parseError)
      throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}...`)
    }
  } catch (error) {
    // Don't log 404 errors for stand configurations
    if (!(error instanceof Error && error.message.includes("Not Found") && endpoint.includes("/stand-config/"))) {
      console.error(`Error in GET request to ${endpoint}:`, error)
    }
    throw error
  }
}

// Generic POST request
export async function post<T>(endpoint: string, data: any): Promise<T> {
  try {
    const token = localStorage.getItem("token")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Normalize the endpoint to ensure it starts with a slash
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

    // Normalize the base URL to ensure it doesn't end with a slash
    const baseUrl = API_CONFIG.baseUrl.endsWith("/") ? API_CONFIG.baseUrl.slice(0, -1) : API_CONFIG.baseUrl

    const url = `${baseUrl}${normalizedEndpoint}`
    console.log(`Making POST request to: ${url}`, data)

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error response from ${url}:`, errorText)
      throw new Error(`Cannot ${response.statusText} ${endpoint}`)
    }

    // Check if the response is empty
    const text = await response.text()
    if (!text) {
      console.log(`Empty response from ${url}`)
      return null as unknown as T
    }

    try {
      // Try to parse the response as JSON
      return JSON.parse(text)
    } catch (parseError) {
      console.error(`Error parsing JSON response from ${url}:`, parseError)
      throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}...`)
    }
  } catch (error) {
    console.error(`Error in POST request to ${endpoint}:`, error)
    throw error
  }
}

// Generic PUT request
export async function put<T>(endpoint: string, data: any): Promise<T> {
  try {
    const token = localStorage.getItem("token")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Normalize the endpoint to ensure it starts with a slash
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

    // Normalize the base URL to ensure it doesn't end with a slash
    const baseUrl = API_CONFIG.baseUrl.endsWith("/") ? API_CONFIG.baseUrl.slice(0, -1) : API_CONFIG.baseUrl

    const url = `${baseUrl}${normalizedEndpoint}`
    console.log(`Making PUT request to: ${url}`, data)

    const response = await fetch(url, {
      method: "PUT",
      headers,
      credentials: "include",
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error response from ${url}:`, errorText)
      throw new Error(`Cannot ${response.statusText} ${endpoint}`)
    }

    // Check if the response is empty
    const text = await response.text()
    if (!text) {
      console.log(`Empty response from ${url}`)
      return null as unknown as T
    }

    try {
      // Try to parse the response as JSON
      return JSON.parse(text)
    } catch (parseError) {
      console.error(`Error parsing JSON response from ${url}:`, parseError)
      throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}...`)
    }
  } catch (error) {
    console.error(`Error in PUT request to ${endpoint}:`, error)
    throw error
  }
}

// Generic PATCH request
export async function patch<T>(endpoint: string, data: any): Promise<T> {
  try {
    const token = localStorage.getItem("token")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Normalize the endpoint to ensure it starts with a slash
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

    // Normalize the base URL to ensure it doesn't end with a slash
    const baseUrl = API_CONFIG.baseUrl.endsWith("/") ? API_CONFIG.baseUrl.slice(0, -1) : API_CONFIG.baseUrl

    const url = `${baseUrl}${normalizedEndpoint}`
    console.log(`Making PATCH request to: ${url}`, data)

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      credentials: "include",
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error response from ${url}:`, errorText)
      throw new Error(`Cannot ${response.statusText} ${endpoint}`)
    }

    // Check if the response is empty
    const text = await response.text()
    if (!text) {
      console.log(`Empty response from ${url}`)
      return null as unknown as T
    }

    try {
      // Try to parse the response as JSON
      return JSON.parse(text)
    } catch (parseError) {
      console.error(`Error parsing JSON response from ${url}:`, parseError)
      throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}...`)
    }
  } catch (error) {
    console.error(`Error in PATCH request to ${endpoint}:`, error)
    throw error
  }
}

// Generic DELETE request
export async function del<T>(endpoint: string): Promise<T> {
  try {
    const token = localStorage.getItem("token")
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    // Normalize the endpoint to ensure it starts with a slash
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

    // Normalize the base URL to ensure it doesn't end with a slash
    const baseUrl = API_CONFIG.baseUrl.endsWith("/") ? API_CONFIG.baseUrl.slice(0, -1) : API_CONFIG.baseUrl

    const url = `${baseUrl}${normalizedEndpoint}`
    console.log(`Making DELETE request to: ${url}`)

    const response = await fetch(url, {
      method: "DELETE",
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error response from ${url}:`, errorText)
      throw new Error(`Cannot ${response.statusText} ${endpoint}`)
    }

    // Check if the response is empty
    const text = await response.text()
    if (!text) {
      console.log(`Empty response from ${url}`)
      return null as unknown as T
    }

    try {
      // Try to parse the response as JSON
      return JSON.parse(text)
    } catch (parseError) {
      console.error(`Error parsing JSON response from ${url}:`, parseError)
      throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}...`)
    }
  } catch (error) {
    console.error(`Error in DELETE request to ${endpoint}:`, error)
    throw error
  }
}

// Añadir un alias para del como deleteRequest para mantener compatibilidad
export const deleteRequest = del
