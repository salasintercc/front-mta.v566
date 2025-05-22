"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { completeProfile } from "@/services/user-service"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { countries } from "@/utils/countries"

export default function CompleteProfilePage() {
  const { user, updateUser, isProfileComplete } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: user?.username || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    cargo: user?.cargo || "",
    empresa: user?.empresa || "",
    paisResidencia: user?.paisResidencia || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Redirigir si el usuario no está autenticado o si su perfil ya está completo
  useEffect(() => {
    if (!user) {
      router.push("/")
    } else if (isProfileComplete) {
      router.push("/users/dashboard")
    }
  }, [user, isProfileComplete, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)

      // Validar campos requeridos
      if (!formData.username) {
        setError("El nombre de usuario es obligatorio")
        setIsSubmitting(false)
        return
      }

      const token = localStorage.getItem("token")
      if (!token || !user?.id) {
        setError("No se encontró información de autenticación. Por favor, inicie sesión nuevamente.")
        setIsSubmitting(false)
        return
      }

      // Enviar datos al servidor
      const updatedUser = await completeProfile(user.id, formData, token)

      // Actualizar el contexto de autenticación
      updateUser({
        ...updatedUser,
        isProfileCompleted: true,
      })

      setSuccess(true)

      // Redirigir después de un breve retraso
      setTimeout(() => {
        router.push("/users/dashboard")
      }, 2000)
    } catch (err: any) {
      console.error("Error completing profile:", err)
      setError(err.message || "Error al completar el perfil")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return null // No renderizar nada si no hay usuario
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <section className="py-16 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Completa tu Perfil</h1>
            <p className="text-gray-light">
              Para continuar usando nuestra plataforma, necesitamos un poco más de información sobre ti.
            </p>
          </div>

          {error && (
            <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6">
              <p className="text-white">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-800/20 border border-green-700 p-4 rounded-md mb-6">
              <p className="text-white">¡Perfil completado con éxito! Redirigiendo...</p>
            </div>
          )}

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
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-burgundy hover:bg-burgundy/90 text-white px-4 py-3 rounded-md transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Completar Perfil"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  )
}
