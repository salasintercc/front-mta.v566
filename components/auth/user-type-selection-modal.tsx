"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { UserRole } from "@/types/user"

interface UserTypeSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserTypeSelectionModal({ isOpen, onClose }: UserTypeSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.VISITOR)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, updateUser } = useAuth()
  const router = useRouter()

  if (!isOpen || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      console.log(`Enviando solicitud para actualizar rol de usuario a: ${selectedRole}`)

      // Actualizar el rol y el estado de perfil completado
      const result = await updateUser({
        role: selectedRole,
        isProfileCompleted: true,
      })

      if (result) {
        console.log(`Rol de usuario actualizado exitosamente a: ${selectedRole}`)
        console.log("Datos de usuario actualizados:", result)

        // Cerrar el modal y redirigir al dashboard
        onClose()
        router.push("/users/dashboard")
      } else {
        throw new Error("No se pudo actualizar el rol de usuario")
      }
    } catch (err: any) {
      console.error("Error al actualizar el rol de usuario:", err)
      setError(
        "Hubo un problema al actualizar tu rol de usuario. La selección se guardó localmente, pero podría no reflejarse en todas las funcionalidades.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-rich-black p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-light hover:text-white"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>

        <h2 className="mb-6 text-center text-2xl font-cormorant font-light tracking-wider uppercase">
          Completa tu registro
        </h2>

        <p className="mb-6 text-gray-light text-center">Selecciona el tipo de usuario con el que deseas registrarte:</p>

        {error && (
          <div className="mb-4 rounded bg-red-900/30 border border-red-500 p-3 text-sm text-red-200">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedRole === UserRole.VISITOR ? "border-gold bg-dark-gray/50" : "border-gray-700 hover:border-gray-500"
              }`}
              onClick={() => setSelectedRole(UserRole.VISITOR)}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedRole === UserRole.VISITOR ? "border-gold" : "border-gray-500"
                  }`}
                >
                  {selectedRole === UserRole.VISITOR && <div className="w-3 h-3 rounded-full bg-gold"></div>}
                </div>
                <div>
                  <h3 className="font-medium text-white">Visitante</h3>
                  <p className="text-sm text-gray-light">Accede a eventos y contenido general</p>
                </div>
              </div>
            </div>

            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedRole === UserRole.EXHIBITOR ? "border-gold bg-dark-gray/50" : "border-gray-700 hover:border-gray-500"
              }`}
              onClick={() => setSelectedRole(UserRole.EXHIBITOR)}
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedRole === UserRole.EXHIBITOR ? "border-gold" : "border-gray-500"
                  }`}
                >
                  {selectedRole === UserRole.EXHIBITOR && <div className="w-3 h-3 rounded-full bg-gold"></div>}
                </div>
                <div>
                  <h3 className="font-medium text-white">Expositor</h3>
                  <p className="text-sm text-gray-light">Accede a webinars exclusivos y funcionalidades adicionales</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 mb-2">
            <p className="text-sm text-gray-light">
              Has seleccionado:{" "}
              <span className="font-medium text-gold">
                {selectedRole === UserRole.VISITOR ? "Visitante" : "Expositor"}
              </span>
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-burgundy py-2 text-white transition-colors hover:bg-burgundy/80 disabled:opacity-50"
          >
            {isSubmitting ? "Procesando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  )
}
