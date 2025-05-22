"use client"
import { useState } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { createUser } from "@/services/user-service"
import { ArrowLeft, Save } from "lucide-react"
import { countries } from "@/utils/countries"

export default function CreateUserPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    cargo: "",
    empresa: "",
    paisResidencia: "",
    role: "user",
    isActive: "true",
    userType: "visitor", // Valor por defecto: visitor
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      const userData = { ...formData }
      const newUser = await createUser(userData, token)

      setSuccessMessage("Usuario creado correctamente")

      // Esperar un momento antes de redirigir
      setTimeout(() => {
        router.push(`/admin/users/${newUser._id}`)
      }, 2000)
    } catch (err: any) {
      console.error("Error creating user:", err)
      setError(err.message || "Error al crear el usuario")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-dark-gray hover:bg-dark-gray/80 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold">Crear Nuevo Usuario</h1>
        </div>

        {error && (
          <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-8">
            <p className="text-white">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-900/20 border border-green-500 p-4 rounded-md mb-8">
            <p className="text-white">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-dark-gray rounded-lg overflow-hidden shadow-xl">
          {/* Información básica */}
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold mb-4">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="username">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="password">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                  required
                />
                <p className="text-xs text-gray-light mt-1">
                  Mínimo 8 caracteres, incluyendo al menos una letra mayúscula, un número y un carácter especial.
                </p>
              </div>
              <div>
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="firstName">
                  Nombre
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="lastName">
                  Apellidos
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>
          </div>

          {/* Información profesional */}
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold mb-4">Información Profesional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="cargo">
                  Cargo
                </label>
                <input
                  type="text"
                  id="cargo"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="empresa">
                  Empresa
                </label>
                <input
                  type="text"
                  id="empresa"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="paisResidencia">
                  País de residencia
                </label>
                <select
                  id="paisResidencia"
                  name="paisResidencia"
                  value={formData.paisResidencia}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="">Seleccionar país</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Configuración de la cuenta */}
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Configuración de la Cuenta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="role">
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                  <option value="exhibitor">Exhibidor</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="userType">
                  Tipo de Usuario (Obsoleto)
                </label>
                <select
                  id="userType"
                  name="userType"
                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold opacity-50"
                  value={formData.userType}
                  onChange={handleChange}
                  disabled
                >
                  <option value="visitor">Visitante</option>
                  <option value="exhibitor">Exhibidor</option>
                </select>
                <p className="text-sm text-amber-400 mt-1">
                  Este campo está obsoleto. Por favor, use el campo "Rol" para definir el tipo de usuario.
                </p>
              </div>
              <div>
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="isActive">
                  Estado
                </label>
                <select
                  id="isActive"
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="p-6 bg-rich-black border-t border-gray-700 flex justify-between">
            <Link
              href="/admin/dashboard?tab=users"
              className="px-4 py-2 border border-gray-600 rounded-md hover:bg-dark-gray transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-burgundy hover:bg-burgundy/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Crear Usuario</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
