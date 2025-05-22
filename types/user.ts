export enum UserRole {
  ADMIN = "admin",
  VISITOR = "visitor",
  EXHIBITOR = "exhibitor"
}

export interface User {
  id?: string
  _id?: string // Para compatibilidad con MongoDB
  username: string
  email: string
  password?: string // Opcional para usuarios de Google
  role: UserRole
  isActive: boolean
  isDeleted?: boolean

  // Campos existentes
  cargo?: string
  empresa?: string
  paisResidencia?: string

  // Nuevos campos para autenticación social
  firstName?: string
  lastName?: string
  picture?: string
  provider?: string // 'local' o 'google'

  // Indicador de perfil completo
  isProfileCompleted?: boolean

  // Campos para recuperación de contraseña
  resetPasswordToken?: string
  resetPasswordExpires?: Date

  // ID de Google
  googleId?: string

  // Campos de timestamp
  createdAt?: string
  updatedAt?: string
}
