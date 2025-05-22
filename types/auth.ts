import { IsEmail, IsNotEmpty, IsString, Matches, MinLength, MaxLength } from "class-validator"

// DTOs para autenticación que coinciden exactamente con los de la API
export interface LoginDto {
  email: string
  password: string
}

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  username: string

  @IsEmail()
  email: string

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message: "La contraseña debe tener al menos una mayúscula, una minúscula, un número y un símbolo",
  })
  password: string

  @IsNotEmpty()
  @IsString()
  cargo: string

  @IsNotEmpty()
  @IsString()
  empresa: string

  @IsNotEmpty()
  @IsString()
  paisResidencia: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    username: string
    email: string
    role: string
    isActive: boolean
    isDeleted?: boolean
    cargo?: string
    empresa?: string
  }
}

export interface User {
  id: string
  username: string
  email: string
  role: string
  isActive: boolean
  isDeleted?: boolean
  cargo?: string
  empresa?: string
}
