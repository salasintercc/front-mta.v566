"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import AuthGuard from "@/components/route-guards/auth-guard"
import { changePassword, type ChangePasswordDto } from "@/services/user-service"

export default function ChangePasswordPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const { user: currentUser } = useAuth()

  const [formData, setFormData] = useState<ChangePasswordDto>({
    currentPassword: "",
    newPassword: "",
  })

  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Verificar si el usuario actual puede cambiar la contraseña
  const canChangePassword = currentUser?.id === userId

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "confirmPassword") {
      setConfirmPassword(value)
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Modificar la función handleSubmit para adaptarla al formato que espera el backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que las contraseñas coincidan
    if (formData.newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Cambiar la contraseña
      await changePassword(userId, formData, token)

      setSuccessMessage("Contraseña actualizada correctamente")

      // Limpiar el formulario
      setFormData({
        currentPassword: "",
        newPassword: "",
      })
      setConfirmPassword("")

      // Redirigir después de un breve retraso
      setTimeout(() => {
        router.push(`/users/${userId}`)
      }, 2000)
    } catch (err: any) {
      console.error("Error changing password:", err)
      setError(err.message || "Error al cambiar la contraseña")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AuthGuard requiredRole="user" allowSelfAccess={true} userId={userId}>
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">Cambiar Contraseña</h1>

            {!canChangePassword ? (
              <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md">
                <p className="text-white">No tienes permiso para cambiar la contraseña de este usuario</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-dark-gray p-6 rounded-lg max-w-md mx-auto">
                {error && (
                  <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6">
                    <p className="text-white">{error}</p>
                  </div>
                )}

                {successMessage && (
                  <div className="bg-green-900/20 border border-green-700 p-4 rounded-md mb-6">
                    <p className="text-white">{successMessage}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-light mb-1">
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-light mb-1">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-light mb-1">
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Guardando..." : "Cambiar Contraseña"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push(`/users/${userId}`)}
                    className="bg-dark-gray border border-burgundy hover:bg-burgundy/20 text-white px-4 py-2 rounded-md transition-colors"
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
