"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { jwtDecode } from "jwt-decode"
import { API_CONFIG } from "@/utils/api-config"
import type { User } from "@/types/user"
import { UserRole } from "@/types/user"

// Define el tipo para el contexto de autenticación
interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (
    username: string,
    email: string,
    password: string,
    cargo?: string,
    empresa?: string,
    paisResidencia?: string,
    firstName?: string,
    lastName?: string,
    role?: string,
  ) => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<User | null>
  handleGoogleCallback: (token: string) => Promise<void>
  isProfileComplete: boolean
  isExhibitor: boolean
  canAccessWebinars: boolean
  getAccessToken: () => string | null
}

// Crea el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

// Proveedor del contexto
interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isProfileComplete, setIsProfileComplete] = useState(true)
  const [isExhibitor, setIsExhibitor] = useState(false)
  const [canAccessWebinars, setCanAccessWebinars] = useState(false)

  // Función para verificar si el usuario puede acceder a webinars
  const checkWebinarAccess = (userData: User | null) => {
    if (!userData) return false
    return userData.role === UserRole.EXHIBITOR || userData.role === UserRole.ADMIN
  }

  // Efecto para cargar el usuario desde localStorage al iniciar
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const decoded: any = jwtDecode(token)
        // Verificar si el token ha expirado
        const currentTime = Date.now() / 1000
        if (decoded.exp && decoded.exp < currentTime) {
          // Token expirado, limpiar
          localStorage.removeItem("token")
          setUser(null)
          setIsAuthenticated(false)
          setIsExhibitor(false)
          setCanAccessWebinars(false)
        } else {
          // Token válido, cargar usuario
          const storedUser = localStorage.getItem("user")
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser)

            // Asegurarse de que el email esté presente
            if (decoded.email && (!parsedUser.email || parsedUser.email === "")) {
              parsedUser.email = decoded.email
              // Guardar el usuario actualizado en localStorage
              localStorage.setItem("user", JSON.stringify(parsedUser))
            }

            setUser(parsedUser)
            setIsAuthenticated(true)

            // Verificar si el perfil está completo
            setIsProfileComplete(parsedUser.isProfileCompleted !== false)

            // Verificar si el usuario es exhibidor
            setIsExhibitor(parsedUser.role === UserRole.EXHIBITOR)

            // Verificar si puede acceder a webinars (exhibidor o admin)
            setCanAccessWebinars(checkWebinarAccess(parsedUser))
          }
        }
      } catch (error) {
        console.error("Error al decodificar el token:", error)
        localStorage.removeItem("token")
      }
    }
    setLoading(false)
  }, [])

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.login}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al iniciar sesión")
      }

      const data = await response.json()
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      setUser(data.user)
      setIsAuthenticated(true)
      setIsProfileComplete(data.user.isProfileCompleted !== false)
      setIsExhibitor(data.user.role === UserRole.EXHIBITOR)
      setCanAccessWebinars(checkWebinarAccess(data.user))
    } catch (error: any) {
      console.error("Error en login:", error)
      throw error
    }
  }

  // Función para registrarse
  const register = async (
    username: string,
    email: string,
    password: string,
    cargo?: string,
    empresa?: string,
    paisResidencia?: string,
    firstName?: string,
    lastName?: string,
    role?: string,
  ) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.register}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          cargo,
          empresa,
          paisResidencia,
          firstName,
          lastName,
          role: role || UserRole.VISITOR, // Por defecto, los usuarios son visitantes
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al registrarse")
      }

      const data = await response.json()
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      setUser(data.user)
      setIsAuthenticated(true)
      setIsProfileComplete(true) // Los usuarios registrados manualmente tienen perfil completo por defecto
      setIsExhibitor(data.user.role === UserRole.EXHIBITOR)
      setCanAccessWebinars(checkWebinarAccess(data.user))
    } catch (error: any) {
      console.error("Error en register:", error)
      throw error
    }
  }

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setIsAuthenticated(false)
    setIsProfileComplete(true) // Resetear el estado
    setIsExhibitor(false)
    setCanAccessWebinars(false)
  }

  // Función para actualizar datos del usuario
  const updateUser = async (userData: Partial<User>): Promise<User | null> => {
    if (!user) {
      console.error("No hay usuario para actualizar")
      return null
    }

    try {
      console.log("Datos recibidos para actualizar:", userData)

      // Asegurarnos de que el rol sea del tipo correcto
      let validatedUserData = { ...userData }
      if (userData.role) {
        // Si el rol viene como string, convertirlo a UserRole
        if (typeof userData.role === 'string') {
          switch (userData.role.toLowerCase()) {
            case 'admin':
              validatedUserData.role = UserRole.ADMIN
              break
            case 'visitor':
              validatedUserData.role = UserRole.VISITOR
              break
            case 'exhibitor':
              validatedUserData.role = UserRole.EXHIBITOR
              break
            default:
              throw new Error("Rol de usuario no válido. Debe ser: admin, visitor o exhibitor")
          }
        } else if (![UserRole.ADMIN, UserRole.VISITOR, UserRole.EXHIBITOR].includes(userData.role)) {
          throw new Error("Rol de usuario no válido. Debe ser: admin, visitor o exhibitor")
        }
      }

      // Crear una copia del usuario con los datos actualizados
      const updatedUser = { ...user, ...validatedUserData }

      // Actualizar localmente primero para mejorar la experiencia del usuario
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)

      // Actualizar estados relacionados
      if (validatedUserData.isProfileCompleted !== undefined) {
        setIsProfileComplete(validatedUserData.isProfileCompleted)
      }

      if (validatedUserData.role !== undefined) {
        const isUserExhibitor = validatedUserData.role === UserRole.EXHIBITOR
        setIsExhibitor(isUserExhibitor)
        console.log(`Estado isExhibitor actualizado a: ${isUserExhibitor}`)
        setCanAccessWebinars(isUserExhibitor || updatedUser.role === UserRole.ADMIN)
      }

      // Si hay un cambio en el rol, intentar actualizarlo en el servidor
      if (validatedUserData.role) {
        try {
          const token = localStorage.getItem("token")
          if (!token) {
            throw new Error("No hay token de autenticación")
          }

          // Determinar la URL correcta para la actualización
          const updateUrl = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.users}/${user.id}`

          console.log(`Intentando actualizar rol de usuario a '${validatedUserData.role}' en: ${updateUrl}`)

          const response = await fetch(updateUrl, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ role: validatedUserData.role }),
          })

          if (!response.ok) {
            // Si el intento falla, registramos el error pero continuamos
            const errorText = await response.text()
            console.error(
              `Error al actualizar el rol de usuario en el servidor (${response.status}):`,
              errorText ? errorText : "No hay detalles del error",
            )
            console.warn("Continuando con actualización local a pesar del error del servidor")
          } else {
            const responseData = await response.json()
            console.log("Respuesta exitosa del servidor:", responseData)
          }
        } catch (error) {
          console.error("Error al comunicarse con el servidor:", error)
          console.warn("Continuando con actualización local a pesar del error")
        }
      }

      return updatedUser
    } catch (error) {
      console.error("Error general al actualizar el usuario:", error)
      throw error
    }
  }

  // Función para manejar el callback de Google
  const handleGoogleCallback = async (token: string) => {
    try {
      // Verificar si ya tenemos este token almacenado para evitar procesamiento redundante
      const existingToken = localStorage.getItem("token")
      if (existingToken === token && isAuthenticated) {
        return // Evitar procesamiento redundante
      }

      // Almacenar el token
      localStorage.setItem("token", token)

      // Decodificar el token para obtener la información del usuario
      const decoded: any = jwtDecode(token)

      // Verificar si el usuario ya tiene un rol asignado en el token
      const hasAssignedRole = decoded.role && decoded.role !== "user"
      const isProfileAlreadyCompleted = decoded.isProfileCompleted === true

      // Extraer la información del usuario del token
      const userData: User = {
        id: decoded.sub,
        username: decoded.username || decoded.name || "Usuario de Google",
        email: decoded.email || "",
        role: decoded.role || "user",
        isActive: true,
        firstName: decoded.firstName || decoded.given_name,
        lastName: decoded.lastName || decoded.family_name,
        picture: decoded.picture,
        provider: "google",
        // Solo marcamos como incompleto si no tiene un rol asignado o si isProfileCompleted es false
        isProfileCompleted: hasAssignedRole || isProfileAlreadyCompleted,
        googleId: decoded.googleId || decoded.sub,
      }

      console.log("Datos de usuario extraídos del token:", userData)
      console.log("¿Usuario tiene rol asignado?", hasAssignedRole)
      console.log("¿Perfil ya completado?", isProfileAlreadyCompleted)

      // Guardar la información del usuario
      localStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)
      setIsAuthenticated(true)
      setIsProfileComplete(hasAssignedRole || isProfileAlreadyCompleted) // Solo mostrar modal si no tiene rol
      setIsExhibitor(userData.role === UserRole.EXHIBITOR)
      setCanAccessWebinars(checkWebinarAccess(userData))
    } catch (error: any) {
      console.error("Error al procesar el token de Google:", error)
      throw new Error("Error al procesar la autenticación con Google")
    }
  }

  // Función para obtener el token de acceso
  const getAccessToken = () => {
    return localStorage.getItem("token")
  }

  // Valor del contexto
  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    register,
    updateUser,
    handleGoogleCallback,
    isProfileComplete,
    isExhibitor,
    canAccessWebinars,
    getAccessToken,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
