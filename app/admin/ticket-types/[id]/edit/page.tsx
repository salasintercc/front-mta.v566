"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { getTicketTypeById, updateTicketType } from "@/services/ticket-type-service"
import { getAllEvents } from "@/services/event-service"
import type { Event } from "@/services/event-service"
import type { TicketType } from "@/services/ticket-type-service"
import { ArrowLeft, Plus, Minus } from "lucide-react"
import Link from "next/link"

export default function EditTicketTypePage() {
  const params = useParams()
  const router = useRouter()
  const ticketTypeId = params.id as string

  const [ticketType, setTicketType] = useState<TicketType | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    stock: 0,
    benefits: [""],
    eventId: "",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        // Cargar el tipo de ticket y los eventos en paralelo
        const [ticketTypeData, eventsData] = await Promise.all([
          getTicketTypeById(ticketTypeId, token),
          getAllEvents(token),
        ])

        setTicketType(ticketTypeData)
        setEvents(eventsData)

        // Inicializar el formulario con los datos del tipo de ticket
        setFormData({
          name: ticketTypeData.name,
          price: ticketTypeData.price,
          stock: ticketTypeData.stock,
          benefits: ticketTypeData.benefits && ticketTypeData.benefits.length > 0 ? ticketTypeData.benefits : [""],
          eventId: ticketTypeData.eventId,
        })
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Error al cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }

    if (ticketTypeId) {
      fetchData()
    }
  }, [ticketTypeId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Manejar cambios en los beneficios
  const handleBenefitChange = (index: number, value: string) => {
    const updatedBenefits = [...formData.benefits]
    updatedBenefits[index] = value
    setFormData((prev) => ({ ...prev, benefits: updatedBenefits }))
  }

  // Añadir un nuevo beneficio
  const addBenefit = () => {
    setFormData((prev) => ({ ...prev, benefits: [...prev.benefits, ""] }))
  }

  // Eliminar un beneficio
  const removeBenefit = (index: number) => {
    const updatedBenefits = formData.benefits.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, benefits: updatedBenefits.length ? updatedBenefits : [""] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validación básica
    if (!formData.name || formData.price <= 0 || formData.stock <= 0 || !formData.eventId) {
      setError("Por favor, completa todos los campos requeridos correctamente")
      return
    }

    // Filtrar beneficios vacíos
    const filteredBenefits = formData.benefits.filter((benefit) => benefit.trim() !== "")

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Actualizar el tipo de ticket con los beneficios filtrados
      await updateTicketType(
        ticketTypeId,
        {
          ...formData,
          benefits: filteredBenefits,
        },
        token,
      )

      router.push("/admin/dashboard?tab=ticket-types")
    } catch (err: any) {
      console.error("Error updating ticket type:", err)
      setError(err.message || "Error al actualizar el tipo de ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl md:text-4xl font-bold">Editar Tipo de Ticket</h1>
              <Link
                href="/admin/dashboard?tab=ticket-types"
                className="flex items-center gap-2 text-gold hover:text-gold/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver al panel</span>
              </Link>
            </div>

            {error && (
              <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6">
                <p className="text-white">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                <p className="mt-4">Cargando datos del tipo de ticket...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-dark-gray p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-light mb-1">
                      Nombre del tipo de ticket *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-light mb-1">
                        Precio (€) *
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="stock" className="block text-sm font-medium text-gray-light mb-1">
                        Stock disponible *
                      </label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="eventId" className="block text-sm font-medium text-gray-light mb-1">
                      Evento asociado *
                    </label>
                    <select
                      id="eventId"
                      name="eventId"
                      value={formData.eventId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    >
                      <option value="" disabled>
                        Selecciona un evento
                      </option>
                      {events.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-light">Beneficios</label>
                      <button
                        type="button"
                        onClick={addBenefit}
                        className="text-gold hover:text-gold/80 flex items-center text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Añadir beneficio
                      </button>
                    </div>

                    {formData.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => handleBenefitChange(index, e.target.value)}
                          placeholder="Ej: Acceso a todas las charlas"
                          className="flex-grow px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        />
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="text-red-500 hover:text-red-400"
                          disabled={formData.benefits.length === 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <p className="text-xs text-gray-light mt-1">Añade los beneficios que incluye este tipo de ticket</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </button>

                  <Link
                    href="/admin/dashboard?tab=ticket-types"
                    className="bg-dark-gray border border-burgundy hover:bg-burgundy/20 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Cancelar
                  </Link>
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
