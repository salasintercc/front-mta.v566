/**
 * SERVICIO DE API DIRECTO
 *
 * Este archivo proporciona funciones simples y directas para comunicarse con la API
 * sin capas de abstracción adicionales que puedan complicar la depuración.
 */

// URL base de la API - asegúrate de que esta URL es correcta
const API_BASE_URL = "http://localhost:4000/api"

// Función para registrar un usuario directamente
export async function registerUser(userData: {
  username: string
  email: string
  password: string
  cargo?: string
  empresa?: string
}) {
  console.log("🔄 Intentando registrar usuario con datos:", userData)
  console.log("📡 URL completa:", `${API_BASE_URL}/auth/register`)

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
      // Asegura que las cookies se envíen en solicitudes cross-origin
      credentials: "include",
    })

    console.log("📊 Estado de la respuesta:", response.status)

    // Obtener el cuerpo de la respuesta como texto primero para depuración
    const responseText = await response.text()
    console.log("📝 Respuesta como texto:", responseText)

    // Si la respuesta no es exitosa, lanzar un error
    if (!response.ok) {
      throw new Error(`Error en registro: ${response.status} - ${responseText}`)
    }

    // Intentar parsear la respuesta como JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
      console.log("✅ Datos de respuesta parseados:", responseData)
    } catch (parseError) {
      console.error("❌ Error al parsear respuesta JSON:", parseError)
      throw new Error(`Error al parsear respuesta: ${responseText}`)
    }

    // Guardar token en localStorage si existe
    if (responseData.token) {
      console.log("🔑 Token recibido:", responseData.token)
      localStorage.setItem("token", responseData.token)
      localStorage.setItem("user", JSON.stringify(responseData.user))
      console.log("🔑 Token guardado en localStorage:", localStorage.getItem("token"))
    } else {
      console.error("❌ No se recibió token en la respuesta")
    }

    return responseData
  } catch (error) {
    console.error("❌ Error en registerUser:", error)
    throw error
  }
}

// Función para iniciar sesión directamente
export async function loginUser(credentials: { email: string; password: string }) {
  console.log("🔄 Intentando iniciar sesión con credenciales:", credentials)
  console.log("📡 URL completa:", `${API_BASE_URL}/auth/login`)

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      credentials: "include",
    })

    console.log("📊 Estado de la respuesta:", response.status)

    // Obtener el cuerpo de la respuesta como texto primero para depuración
    const responseText = await response.text()
    console.log("📝 Respuesta como texto:", responseText)

    // Si la respuesta no es exitosa, lanzar un error
    if (!response.ok) {
      throw new Error(`Error en login: ${response.status} - ${responseText}`)
    }

    // Intentar parsear la respuesta como JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
      console.log("✅ Datos de respuesta parseados:", responseData)
    } catch (parseError) {
      console.error("❌ Error al parsear respuesta JSON:", parseError)
      throw new Error(`Error al parsear respuesta: ${responseText}`)
    }

    // Guardar token en localStorage si existe
    if (responseData.token) {
      console.log("🔑 Token recibido:", responseData.token)
      localStorage.setItem("token", responseData.token)
      localStorage.setItem("user", JSON.stringify(responseData.user))
      console.log("🔑 Token guardado en localStorage:", localStorage.getItem("token"))
    } else {
      console.error("❌ No se recibió token en la respuesta")
    }

    return responseData
  } catch (error) {
    console.error("❌ Error en loginUser:", error)
    throw error
  }
}

// Función para verificar si el usuario está autenticado
export function isAuthenticated() {
  return !!localStorage.getItem("token")
}

// Función para obtener el usuario actual
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem("user")
    // Verificar que userStr no sea null o undefined antes de intentar parsearlo
    if (!userStr) return null

    return JSON.parse(userStr)
  } catch (error) {
    console.error("❌ Error al parsear usuario del localStorage:", error)
    // En caso de error, limpiar el localStorage para evitar futuros errores
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    return null
  }
}

// Función para cerrar sesión
export function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}
