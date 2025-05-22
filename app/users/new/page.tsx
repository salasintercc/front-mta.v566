"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { createUser, type CreateUserDto } from "@/services/user-service"

export default function CreateUserPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<CreateUserDto & { confirmPassword: string }>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    cargo: "",
    empresa: "",
    role: "user",
  })

  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Modificar la función handleSubmit para adaptarla a los requisitos de contraseña del backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    // Validar requisitos de contraseña según el backend
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/
    if (!passwordRegex.test(formData.password)) {
      setError("La contraseña debe tener al menos una mayúscula, una minúscula, un número y un símbolo")
      return
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    try {
      setIsCreating(true)
      setError(null)

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Crear el usuario
      const { confirmPassword, ...userData } = formData
      await createUser(userData, token)

      // Redirigir al panel de administración
      router.push("/admin/dashboard")
    } catch (err: any) {
      console.error("Error creating user:", err)
      setError(err.message || "Error al crear el usuario")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">Crear Nuevo Usuario</h1>

            <form onSubmit={handleSubmit} className="bg-dark-gray p-6 rounded-lg">
              {error && (
                <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6">
                  <p className="text-white">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-light mb-1">
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
                    <label htmlFor="email" className="block text-sm font-medium text-gray-light mb-1">
                      Correo electrónico
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
                    <label htmlFor="password" className="block text-sm font-medium text-gray-light mb-1">
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
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-light mb-1">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="cargo" className="block text-sm font-medium text-gray-light mb-1">
                      Cargo
                    </label>
                    <input
                      type="text"
                      id="cargo"
                      name="cargo"
                      value={formData.cargo || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label htmlFor="empresa" className="block text-sm font-medium text-gray-light mb-1">
                      Empresa
                    </label>
                    <input
                      type="text"
                      id="empresa"
                      name="empresa"
                      value={formData.empresa || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-light mb-1">
                      Rol
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creando..." : "Crear Usuario"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/dashboard")}
                  className="bg-dark-gray border border-burgundy hover:bg-burgundy/20 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </section>

        <Footer />
      </main>
    </AuthGuard>
  )
}
