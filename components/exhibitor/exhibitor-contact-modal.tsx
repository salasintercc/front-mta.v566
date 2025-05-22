"use client"

import { useState, useEffect } from "react"
import { X, Check } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { updateUser } from "@/services/user-service"
import { countries } from "@/utils/countries"

interface ExhibitorContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  eventId?: string
  eventName?: string
}

export default function ExhibitorContactModal({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  eventName,
}: ExhibitorContactModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    empresa: "",
    cargo: "",
    paisResidencia: "",
    phone: "",
    contactPreference: "email", // 'email' o 'phone'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Cargar datos del usuario si están disponibles
  useEffect(() => {
    if (isOpen) {
      // Reiniciar el estado de éxito cada vez que se abre el modal
      setSuccess(false)
      setError(null)

      // Cargar datos del usuario
      if (user) {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          empresa: user.empresa || "",
          cargo: user.cargo || "",
          paisResidencia: user.paisResidencia || "",
          phone: user.phone || "",
          contactPreference: "email",
        })
      }
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Modificar la función handleSubmit para que no valide si los campos están completos
  // ya que queremos que el usuario pueda modificar sus datos aunque ya estén completos

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!user?.id) {
        throw new Error("No se pudo identificar al usuario")
      }

      // Validar que todos los campos requeridos estén completos
      // const requiredFields = ["firstName", "lastName", "empresa", "cargo", "paisResidencia", "phone"]
      // const missingFields = requiredFields.filter((field) => !formData[field])

      // if (missingFields.length > 0) {
      //   throw new Error("Por favor, completa todos los campos requeridos")
      // }

      // Actualizar datos del usuario
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No se encontró el token de autenticación")
      }

      // Actualizar el perfil del usuario
      await updateUser(
        user.id,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          empresa: formData.empresa,
          cargo: formData.cargo,
          paisResidencia: formData.paisResidencia,
          phone: formData.phone,
          isProfileCompleted: true,
        },
        token,
      )

      // Registrar interés en el evento (esto podría ser una llamada a un servicio específico)
      // Por ahora, solo mostramos un mensaje de éxito
      setSuccess(true)

      // Esperar 3 segundos y luego cerrar el modal
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 3000)
    } catch (err) {
      console.error("Error al actualizar perfil:", err)
      setError(err instanceof Error ? err.message : "Ocurrió un error al procesar tu solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl rounded-lg bg-rich-black p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-light hover:text-white"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>

        <h2 className="mb-6 text-center text-2xl font-bold tracking-wider">
          Completa tus datos para solicitar un stand
        </h2>

        {success ? (
          <div className="rounded-md bg-green-900/30 border border-green-500 p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-900/50 p-3">
                <Check className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">¡Solicitud enviada con éxito!</h3>
            <p className="text-gray-light">
              Hemos recibido tu solicitud para un stand en {eventName || "el evento"}. Nos pondremos en contacto contigo
              pronto a través de {formData.contactPreference === "email" ? "correo electrónico" : "teléfono"}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-900/30 border border-red-500 p-3 text-sm text-red-200">{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block mb-1 text-sm font-medium">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full bg-dark-gray border border-gray-700 p-2 rounded-sm text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block mb-1 text-sm font-medium">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full bg-dark-gray border border-gray-700 p-2 rounded-sm text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="empresa" className="block mb-1 text-sm font-medium">
                  Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="empresa"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  className="w-full bg-dark-gray border border-gray-700 p-2 rounded-sm text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="cargo" className="block mb-1 text-sm font-medium">
                  Cargo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cargo"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  className="w-full bg-dark-gray border border-gray-700 p-2 rounded-sm text-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="paisResidencia" className="block mb-1 text-sm font-medium">
                  País <span className="text-red-500">*</span>
                </label>
                <select
                  id="paisResidencia"
                  name="paisResidencia"
                  value={formData.paisResidencia}
                  onChange={handleChange}
                  className="w-full bg-dark-gray border border-gray-700 p-2 rounded-sm text-white"
                  required
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
                <label htmlFor="phone" className="block mb-1 text-sm font-medium">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-dark-gray border border-gray-700 p-2 rounded-sm text-white"
                  required
                  placeholder="+34 123456789"
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">
                Preferencia de contacto <span className="text-red-500">*</span>
              </p>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contactPreference"
                    value="email"
                    checked={formData.contactPreference === "email"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="contactPreference"
                    value="phone"
                    checked={formData.contactPreference === "phone"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Teléfono</span>
                </label>
              </div>
            </div>

            <div className="bg-dark-gray/50 p-4 rounded-sm mt-4">
              <p className="text-sm text-gray-light">
                Al enviar este formulario, nos pondremos en contacto contigo para proporcionarte información detallada
                sobre las opciones de stands disponibles, precios y el proceso de configuración para{" "}
                {eventName || "el evento seleccionado"}.
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 mr-2 border border-gray-700 text-gray-light hover:bg-dark-gray"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-burgundy hover:bg-burgundy/90 text-white disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Solicitar stand"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
