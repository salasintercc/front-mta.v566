import { post, patch, get, del } from "@/utils/api"
import { API_CONFIG } from "@/config/api"
import type { User } from "@/types/user"
import { UserRole } from "@/types/user"

// Interfaces for user data
export interface CreateUserDto {
  username: string
  email: string
  password?: string
  firstName: string
  lastName: string
  cargo: string
  empresa: string
  paisResidencia: string
  role: UserRole
  isActive: boolean
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface UpdateUserDto {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  cargo?: string
  empresa?: string
  paisResidencia?: string
  role?: UserRole
  isActive?: boolean
}

// Obtener todos los usuarios (solo para administradores)
export const getAllUsers = async (): Promise<User[]> => {
  try {
    return await get<User[]>(API_CONFIG.endpoints.users)
  } catch (error: any) {
    console.error("Error al obtener usuarios:", error)
    throw new Error(error.message || "Error al obtener usuarios")
  }
}

// Obtener un usuario por ID
export const getUserById = async (userId: string): Promise<User> => {
  try {
    return await get<User>(`${API_CONFIG.endpoints.users}/${userId}`)
  } catch (error: any) {
    console.error("Error al obtener usuario:", error)
    throw new Error(error.message || "Error al obtener usuario")
  }
}

// Crear un nuevo usuario (solo para administradores)
export const createUser = async (userData: CreateUserDto): Promise<User> => {
  try {
    console.log("Datos enviados al servidor:", userData)
    return await post<User>(API_CONFIG.endpoints.users, userData)
  } catch (error: any) {
    console.error("Error al crear usuario:", error)
    throw new Error(error.message || "Error al crear usuario")
  }
}

// Reemplazar la función updateUser con una implementación más robusta
export const updateUser = async (userId: string, userData: UpdateUserDto): Promise<User> => {
  try {
    console.log(`Actualizando usuario ${userId} con datos:`, userData)

    // Validar y convertir el rol si está presente
    let processedUserData = { ...userData }
    if (userData.role) {
      // Si el rol viene como string, convertirlo a UserRole
      if (typeof userData.role === 'string') {
        const roleStr = userData.role.toLowerCase()
        switch (roleStr) {
          case 'admin':
            processedUserData.role = UserRole.ADMIN
            break
          case 'visitor':
            processedUserData.role = UserRole.VISITOR
            break
          case 'exhibitor':
            processedUserData.role = UserRole.EXHIBITOR
            break
          default:
            throw new Error("Rol de usuario no válido. Debe ser: admin, visitor o exhibitor")
        }
      } else if (![UserRole.ADMIN, UserRole.VISITOR, UserRole.EXHIBITOR].includes(userData.role)) {
        throw new Error("Rol de usuario no válido. Debe ser: admin, visitor o exhibitor")
      }
    }

    // Usar la función patch de la utilidad de API
    const updatedUser = await patch<User>(`${API_CONFIG.endpoints.users}/${userId}`, {
      ...processedUserData,
      role: processedUserData.role // Ya está en el formato correcto
    })

    console.log("Usuario actualizado correctamente:", updatedUser)
    
    // Asegurarse de que el role sea del tipo correcto al devolverlo
    return {
      ...updatedUser,
      role: updatedUser.role as UserRole
    }
  } catch (error: any) {
    console.error("Error al actualizar usuario:", error)
    throw error
  }
}

// Eliminar un usuario (solo para administradores)
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    console.log(`Eliminando usuario con ID: ${userId}`)
    return await del(`${API_CONFIG.endpoints.users}/${userId}`)
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error)
    throw new Error(error.message || "Error al eliminar usuario")
  }
}

// Cambiar contraseña
export const changePassword = async (userId: string, passwordData: ChangePasswordDto): Promise<void> => {
  try {
    return await patch(`${API_CONFIG.endpoints.users}/${userId}/password`, passwordData)
  } catch (error: any) {
    console.error("Error al cambiar contraseña:", error)
    throw new Error(error.message || "Error al cambiar contraseña")
  }
}

// Completar perfil
export const completeProfile = async (userId: string, profileData: any): Promise<User> => {
  try {
    return await patch<User>(`${API_CONFIG.endpoints.users}/${userId}/complete-profile`, profileData)
  } catch (error: any) {
    console.error("Error al completar perfil:", error)
    throw new Error(error.message || "Error al completar perfil")
  }
}
