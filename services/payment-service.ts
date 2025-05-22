import { API_CONFIG } from "@/config/api"
import { getAuthToken } from "@/utils/auth"

// Función auxiliar para obtener la URL base del webhook
const getWebhookBaseUrl = () => {
  // En desarrollo, usa la URL de ngrok si está disponible
  if (process.env.NEXT_PUBLIC_NGROK_URL) {
    return process.env.NEXT_PUBLIC_NGROK_URL
  }
  // En producción, usa la URL de la API sin el sufijo /api
  return API_CONFIG.getBackendUrl()
}

export interface CreatePaymentParams {
  amount: string
  description?: string
  redirectUrl?: string
  webhookUrl?: string
  ticketId?: string
}

export interface PaymentResponse {
  paymentUrl: string
  paymentId: string
  error?: string
}

export interface PaymentStatus {
  id: string
  status: string
  amount: {
    value: string
    currency: string
  }
  description: string
  metadata: any
}

export interface PaymentVerificationResponse {
  paymentStatus: string
  configStatus: string
}

/**
 * Servicio para gestionar pagos con Mollie
 */
export const PaymentService = {
  /**
   * Crea un nuevo pago y devuelve la URL de pago
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    try {
      // Obtener el token de autenticación
      const token = getAuthToken()
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      // Construir la URL con los parámetros
      const queryParams = new URLSearchParams()
      queryParams.append("amount", params.amount)

      if (params.description) {
        queryParams.append("description", params.description)
      }

      // Manejar la URL de redirección
      if (params.redirectUrl) {
        // No modificar la URL de redirección aquí, usar la que viene del componente
        queryParams.append("redirectUrl", params.redirectUrl)
      }

      if (params.ticketId) {
        queryParams.append("ticketId", params.ticketId)
        console.log("Agregando ticketId a la petición:", params.ticketId)
      }

      // Usar la URL base dinámica para el webhook
      const webhookUrl = params.webhookUrl || `${getWebhookBaseUrl()}/payments/webhook`
      queryParams.append("webhookUrl", webhookUrl)

      console.log("Query params completos:", queryParams.toString())

      // Realizar la petición al backend usando el endpoint correcto
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.createPayment}?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error en la respuesta del servidor:", errorData)
        throw new Error(errorData.message || "Error al crear el pago")
      }

      const data = await response.json()
      console.log("Respuesta del servidor de pagos:", data)
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.paymentUrl || !data.paymentId) {
        throw new Error("Respuesta inválida del servidor de pagos")
      }

      return {
        paymentUrl: data.paymentUrl,
        paymentId: data.paymentId
      }
    } catch (error) {
      console.error("Error en createPayment:", error)
      throw error
    }
  },

  /**
   * Obtiene el estado de un pago
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      // Obtener el token de autenticación
      const token = getAuthToken()
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.getPaymentStatus(paymentId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al obtener el estado del pago")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error en getPaymentStatus:", error)
      throw error
    }
  },

  /**
   * Verifica el estado del pago y la configuración asociada
   */
  async verifyPaymentAndConfig(paymentId: string, ticketId: string): Promise<PaymentVerificationResponse> {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      const response = await fetch(
        `${API_CONFIG.baseUrl}/api/payments/verify?paymentId=${paymentId}&ticketId=${ticketId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al verificar el estado del pago")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error en verifyPaymentAndConfig:", error)
      throw error
    }
  },
}
