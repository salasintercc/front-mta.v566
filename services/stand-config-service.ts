import { get, post, patch } from "@/utils/api"

// Interfaces for stand configuration data
export interface StandConfig {
  _id: string
  user: string | { _id: string; username: string; email: string; fullName?: string; company?: string }
  event: string | { _id: string; title: string }
  standOption: string | { _id: string; title: string }
  configData: any
  totalPrice: number
  priceBreakdown: Record<string, number>
  isSubmitted: boolean
  isPaid: boolean
  paymentStatus: "pending" | "processing" | "completed" | "cancelled"
  createdAt: string
  updatedAt: string
}

// Get stand configurations by event ID
export async function getStandConfigsByEvent(eventId: string): Promise<StandConfig[]> {
  try {
    return await get<StandConfig[]>(`/stand-config/event/${eventId}`)
  } catch (error) {
    console.error(`Error fetching stand configs for event ${eventId}:`, error)
    throw error
  }
}

// Modificar la función downloadConfigAsPdf para usar correctamente la ruta base y la variable de entorno
export async function downloadConfigAsPdf(configId: string): Promise<void> {
  try {
    console.log(`Intentando descargar PDF para la configuración ${configId}`)

    // Obtener el token de localStorage
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No se encontró token de autenticación")
    }

    // URL del backend - Usar la variable de entorno o el valor por defecto
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    console.log("API Base URL:", apiBaseUrl)

    // URL completa para la descarga del PDF usando el ID de la configuración
    const pdfUrl = `${apiBaseUrl}/api/stand-config/config/${configId}/pdf`
    console.log("URL para descarga de PDF:", pdfUrl)

    // Realizar la solicitud fetch con el token en el encabezado de autorización
    const response = await fetch(pdfUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error al descargar PDF (${response.status}):`, errorText)
      throw new Error(`Error downloading PDF: ${response.status}`)
    }

    // Obtener el blob del PDF
    const blob = await response.blob()

    // Crear una URL para el blob
    const url = window.URL.createObjectURL(blob)

    // Crear un enlace para descargar el archivo
    const a = document.createElement("a")
    a.href = url
    a.download = `configuracion-stand-${configId}.pdf`
    document.body.appendChild(a)
    a.click()

    // Limpiar
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    console.log("Descarga de PDF completada correctamente")
    return Promise.resolve()
  } catch (error: any) {
    console.error(`Error al descargar PDF:`, error)
    throw error
  }
}

// Add a new function to download multiple configurations as a single PDF
export async function downloadMultipleConfigsAsPdf(configIds: string[]): Promise<void> {
  try {
    console.log(`Intentando descargar PDF para ${configIds.length} configuraciones`)

    // Obtener el token de localStorage
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No se encontró token de autenticación")
    }

    // URL del backend - Usar la variable de entorno o el valor por defecto
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

    // URL para la descarga del PDF combinado
    const idsParam = configIds.join(",")
    const pdfUrl = `${apiBaseUrl}/api/stand-config/configs/pdf?ids=${idsParam}`

    // Realizar la solicitud fetch con el token en el encabezado de autorización
    const response = await fetch(pdfUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error al descargar PDF combinado (${response.status}):`, errorText)
      throw new Error(`Error downloading combined PDF: ${response.status}`)
    }

    // Obtener el blob del PDF
    const blob = await response.blob()

    // Crear una URL para el blob
    const url = window.URL.createObjectURL(blob)

    // Crear un enlace para descargar el archivo
    const a = document.createElement("a")
    a.href = url
    a.download = `configuraciones-stands-${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(a)
    a.click()

    // Limpiar
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    console.log("Descarga de PDF combinado completada correctamente")
    return Promise.resolve()
  } catch (error: any) {
    console.error(`Error al descargar PDF combinado:`, error)
    throw error
  }
}

// Get user's stand configuration
export async function getUserConfig(standOptionId: string): Promise<StandConfig | null> {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    return await get<StandConfig>(`/stand-config/${standOptionId}`)
  } catch (error) {
    console.error(`Error fetching stand config for ${standOptionId}:`, error)
    return null
  }
}

// Save user's stand configuration
export async function saveConfig(standOptionId: string, configData: any): Promise<StandConfig> {
  try {
    // Si no se proporciona un token, intentar obtenerlo de localStorage
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    // Change from patch to post to match the backend controller
    return await post<StandConfig>(`/stand-config/${standOptionId}`, configData)
  } catch (error) {
    console.error(`Error saving stand config for ${standOptionId}:`, error)
    throw error
  }
}

// Get all stand configurations (admin only)
export async function getAllStandConfigs(): Promise<StandConfig[]> {
  try {
    return await get<StandConfig[]>(`/stand-config`)
  } catch (error) {
    console.error("Error fetching all stand configurations:", error)
    throw error
  }
}

// New function to update payment status of a stand configuration
export async function updatePaymentStatus(
  configId: string,
  status: "pending" | "processing" | "completed" | "cancelled",
): Promise<StandConfig> {
  try {
    console.log(`Updating payment status for config ${configId} to ${status}`)

    // Si no se proporciona un token, intentar obtenerlo de localStorage
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    // Use patch to update only the payment status
    return await patch<StandConfig>(`/stand-config/${configId}/payment-status`, {
      paymentStatus: status,
      isPaid: status === "completed",
    })
  } catch (error) {
    console.error(`Error updating payment status for ${configId}:`, error)
    throw error
  }
}

// New function to get stand configuration by payment reference
export async function getConfigByPaymentReference(paymentReference: string): Promise<StandConfig | null> {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    return await get<StandConfig>(`/stand-config/payment/${paymentReference}`)
  } catch (error) {
    console.error(`Error fetching stand config for payment ${paymentReference}:`, error)
    return null
  }
}

// New function to update all user's stand configurations payment status
// Modified to use the correct endpoint
export async function updateAllUserConfigsPaymentStatus(
  status: "pending" | "processing" | "completed" | "cancelled",
): Promise<boolean> {
  try {
    console.log(`Updating all user's stand configurations payment status to ${status}`)

    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No token found")
    }

    // Use the correct endpoint that matches your backend controller
    // We'll use /stand-config/payment-status/all instead
    await patch<{ success: boolean }>(`/stand-config/payment-status/all`, {
      paymentStatus: status,
      isPaid: status === "completed",
    })

    return true
  } catch (error) {
    console.error(`Error updating all user's stand configurations payment status:`, error)
    return false
  }
}
