"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getUserById, updateUser } from "@/services/user-service"
import type { User } from "@/types/user"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { countries } from "@/utils/countries"

export default function EditUserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const { user: currentUser, updateUser: updateAuthUser } = useAuth()
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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
    userType: "visitor", // Añadir este campo
  })

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          setError("No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.")
          setIsLoading(false)
          return
        }

        const userData = await getUserById(userId, token)
        setUserProfile(userData)
        setFormData({
          username: userData.username || "",
          email: userData.email || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          cargo: userData.cargo || "",
          empresa: userData.empresa || "",
          paisResidencia: userData.paisResidencia || "",
          role: userData.role || "user",
          isActive: userData.isActive !== false,
          userType: userData.userType || "visitor", // Añadir este campo
        })
      } catch (err: any) {
        console.error("Error fetching user profile:", err)
        setError(err.message || "Error al cargar el perfil de usuario")
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchUserProfile()
    }
  }, [userId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "isActive" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Preparar datos para actualizar
      const updateData = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        cargo: formData.cargo,
        empresa: formData.empresa,
        paisResidencia: formData.paisResidencia,
        userType: formData.userType, // Añadir este campo
      }

      // Si es admin, puede actualizar el rol y estado
      if (currentUser?.role === "admin") {
        Object.assign(updateData, {
          role: formData.role,
          isActive: formData.isActive,
        })
      }

      const updatedUser = await updateUser(userId, updateData, token)

      // Si el usuario está actualizando su propio perfil, actualizar el contexto
      if (currentUser?.id === userId) {
        updateAuthUser(updatedUser)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/users/${userId}`)
      }, 2000)
    } catch (err: any) {
      console.error("Error updating user:", err)
      setError(err.message || "Error al actualizar el perfil de usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard requiredRole="user" allowSelfAccess={true} userId={userId}>
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold">Editar Perfil</h1>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                <p className="mt-4">Cargando perfil...</p>
              </div>
            ) : error && !success ? (
              <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6">
                <p className="text-white">{error}</p>
              </div>
            ) : success ? (
              <div className="bg-green-800/20 border border-green-700 p-4 rounded-md mb-6">
                <p className="text-white">Perfil actualizado con éxito. Redirigiendo...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-dark-gray p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-2">
                      Nombre de usuario *
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                      required
                      disabled={userProfile?.provider === "google"} // No permitir cambiar email para usuarios de Google
                    />
                    {userProfile?.provider === "google" && (
                      <p className="text-xs text-gray-light mt-1">
                        El correo electrónico no se puede cambiar para cuentas de Google
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                      Apellido
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                    />
                  </div>

                  <div>
                    <label htmlFor="cargo" className="block text-sm font-medium mb-2">
                      Cargo
                    </label>
                    <input
                      type="text"
                      id="cargo"
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleChange}
                      className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                    />
                  </div>

                  <div>
                    <label htmlFor="empresa" className="block text-sm font-medium mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      id="empresa"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleChange}
                      className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                    />
                  </div>

                  <div>
                    <label htmlFor="paisResidencia" className="block text-sm font-medium mb-2">
                      País de Residencia
                    </label>
                    <select
                      id="paisResidencia"
                      name="paisResidencia"
                      value={formData.paisResidencia}
                      onChange={handleChange}
                      className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                    >
                      <option value="">Selecciona un país</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="userType" className="block text-sm font-medium mb-2">
                      Tipo de Usuario
                    </label>
                    <select
                      id="userType"
                      name="userType"
                      value={formData.userType || "visitor"}
                      onChange={handleChange}
                      className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                    >
                      <option value="visitor">Visitante</option>
                      <option value="exhibitor">Expositor</option>
                    </select>
                  </div>

                  {/* Campos solo para administradores */}
                  {currentUser?.role === "admin" && (
                    <>
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium mb-2">
                          Rol
                        </label>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isActive"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                          className="mr-2 h-4 w-4"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium">
                          Usuario activo
                        </label>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push(`/users/${userId}`)}
                    className="bg-dark-gray border border-gray-700 hover:bg-gray-800 text-white px-6 py-2 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </AuthGuard>
  )
}
