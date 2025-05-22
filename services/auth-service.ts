import { post, get } from "@/utils/api"
import { API_CONFIG } from "@/utils/api-config"
import type { User } from "@/types/user"

export interface LoginDto {
  email: string
  password: string
}

// Actualizar la interfaz RegisterDto para incluir firstName y lastName
export interface RegisterDto {
  username: string
  email: string
  password: string
  cargo?: string
  empresa?: string
  firstName?: string
  lastName?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface SignupData {
  username: string
  email: string
  password: string
  cargo: string
  empresa: string
}

// Función para iniciar sesión
export async function login(loginData: LoginDto): Promise<AuthResponse> {
  try {
    console.log("Intentando login con:", loginData)
    console.log("Endpoint:", API_CONFIG.endpoints.login)
    const response = await post<AuthResponse>(API_CONFIG.endpoints.login, loginData)

    // Guardar token y usuario en localStorage
    if (response.token) {
      localStorage.setItem("token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
      console.log("Token guardado en localStorage:", response.token.substring(0, 20) + "...")
    }

    return response
  } catch (error) {
    console.error("Error en login service:", error)
    throw error
  }
}

// Actualizar la función signup para incluir firstName y lastName
export async function signup(registerData: RegisterDto): Promise<AuthResponse> {
  try {
    console.log("Intentando registro con:", registerData)
    console.log("Endpoint:", API_CONFIG.endpoints.register)
    const response = await post<AuthResponse>(API_CONFIG.endpoints.register, registerData)

    // Guardar token y usuario en localStorage
    if (response.token) {
      localStorage.setItem("token", response.token)
      localStorage.setItem("user", JSON.stringify(response.user))
      console.log("Token guardado en localStorage:", response.token.substring(0, 20) + "...")
    }

    return response
  } catch (error) {
    console.error("Error en signup service:", error)
    throw error
  }
}

// Función para obtener el perfil del usuario
export async function getUserProfile(token: string): Promise<User> {
  try {
    // Intentar obtener el perfil del usuario actual
    return get<User>(API_CONFIG.endpoints.profile || "/users/profile", token)
  } catch (error) {
    console.error("Error getting user profile:", error)
    throw error
  }
}

// Función para verificar si el usuario está autenticado
export function isAuthenticated(): boolean {
  return !!localStorage.getItem("token")
}

// Función para obtener el token actual
export function getToken(): string | null {
  return localStorage.getItem("token")
}

// Función para obtener el usuario actual
export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null
    return JSON.parse(userStr)
  } catch (error) {
    console.error("Error al obtener usuario del localStorage:", error)
    return null
  }
}

// Función para cerrar sesión
export function logout(): void {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

// Función para solicitar recuperación de contraseña
export async function forgotPassword(email: string): Promise<{ message: string }> {
  try {
    const response = await post<{ message: string }>(API_CONFIG.endpoints.forgotPassword || "/auth/forgot-password", {
      email,
    })
    return response
  } catch (error) {
    console.error("Error en forgotPassword service:", error)
    throw error
  }
}

// Función para restablecer la contraseña
export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  try {
    const response = await post<{ message: string }>(API_CONFIG.endpoints.resetPassword || "/auth/reset-password", {
      token,
      newPassword,
    })
    return response
  } catch (error) {
    console.error("Error en resetPassword service:", error)
    throw error
  }
}

// Función para manejar el callback de Google
export const handleGoogleCallback = async (token: string) => {
  try {
    // Verificar si el token es válido
    const response = await fetch(`${API_CONFIG.baseUrl}/auth/google/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      throw new Error("Error al verificar el token de Google")
    }

    // Obtener la información del usuario
    const data = await response.json()

    // Guardar el token y la información del usuario
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))

    return data.user
  } catch (error) {
    console.error("Error en handleGoogleCallback:", error)
    throw error
  }
}

export type { User }
