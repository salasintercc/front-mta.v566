"use client"
import { useState, useEffect, use } from "react"
import type React from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { getUserById, updateUser } from "@/services/user-service"
import type { User } from "@/types/user"
import { ArrowLeft, Save } from "lucide-react"
import { countries } from "@/utils/countries"

export default function EditUserPage({ params }: { params: { id: string } }) {
  const resolvedParams = use(params)
  const userId = resolvedParams.id
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    cargo: "",
    empresa: "",
    paisResidencia: "",
    role: "",
    isActive: true,
    userType: "visitor", // Valor por defecto: visitor
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        const userData = await getUserById(userId, token)
        setUser(userData)
        setFormData({
          username: userData.username || "",
          email: userData.email || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          cargo: userData.cargo || "",
          empresa: userData.empresa || "",
          paisResidencia: userData.paisResidencia || "",
          role: userData.role || "user",
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          userType: userData.userType || "visitor", // Usar el valor existente o "visitor" por defecto
        })
      } catch (err: any) {
        console.error("Error fetching user:", err)
        setError(err.message || "Error al cargar los datos del usuario")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setIsSaving(true)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Convertir isActive a booleano si viene como string
      const userData = {
        ...formData,
        isActive: formData.isActive === true || formData.isActive === "true",
      }

      await updateUser(userId, userData, token)
      setSuccessMessage("Usuario actualizado correctamente")

      // Esperar un momento antes de redirigir
      setTimeout(() => {
        router.push(`/admin/users/${userId}`)
      }, 2000)
    } catch (err: any) {
      console.error("Error updating user:", err)
      setError(err.message || "Error al actualizar el usuario")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />
        <div className="max-w-4xl mx-auto py-16 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
            <span className="ml-4">Cargando datos del usuario...</span>
          </div>
        </div>
      </main>
    )
  }

  if (error && !user) {
    return (
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />
        <div className="max-w-4xl mx-auto py-16 px-4">
          <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-8">
            <p className="text-white">{error}</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-dark-gray hover:bg-dark-gray/80 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </button>
          </div>
        </div>
      </main>
    )
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
          <h1 className="text-3xl font-bold">Editar Usuario</h1>
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

              {/* Añadir este bloque para el tipo de usuario */}
              <div>
                <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="userType">
                  Tipo de Usuario (Obsoleto - Usar Rol)
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
                  Este campo está obsoleto. Por favor, use el campo "Rol" para asignar permisos.
                </p>
              </div>
              <div className="flex items-center mt-8">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive === true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-gold focus:ring-gold border-gray-700 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm">
                  Usuario activo
                </label>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="p-6 bg-rich-black border-t border-gray-700 flex justify-between">
            <Link
              href={`/admin/users/${userId}`}
              className="px-4 py-2 border border-gray-600 rounded-md hover:bg-dark-gray transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-burgundy hover:bg-burgundy/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
