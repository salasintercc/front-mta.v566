"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { getEventById, updateEvent, getAllEvents } from "@/services/event-service"
import type { Event, UpdateEventDto } from "@/services/event-service"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState<UpdateEventDto>({
    title: "",
    description: "",
    date: "",
    location: "",
    image: "",
    isFeatured: false,
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        const eventData = await getEventById(eventId, token)
        setEvent(eventData)

        // Format date for input field (YYYY-MM-DD)
        const formattedDate = new Date(eventData.date).toISOString().split("T")[0]

        setFormData({
          title: eventData.title,
          description: eventData.description,
          date: formattedDate,
          location: eventData.location,
          image: eventData.image || "",
          isFeatured: eventData.isFeatured,
        })
        setSelectedImage(eventData.image || null)
      } catch (err: any) {
        console.error("Error fetching event:", err)
        setError(err.message || "Error al cargar los datos del evento")
      } finally {
        setIsLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      setIsSubmitting(true)
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setFormData((prev) => ({ ...prev, image: data.imageUrl }))
        setSelectedImage(data.imageUrl)
        setError(null)
      } else {
        setError(data.message || "Error al subir la imagen")
      }
    } catch (err: any) {
      console.error("Error uploading image:", err)
      setError(err.message || "Error al subir la imagen")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modificar la función handleSubmit para verificar si ya existe un evento destacado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validación básica
    if (!formData.title || !formData.description || !formData.date || !formData.location) {
      setError("Por favor, completa todos los campos requeridos")
      return
    }

    // Validar que se haya subido una imagen
    if (!formData.image) {
      setError("Por favor, sube una imagen para el evento")
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Si el evento es destacado y no lo era antes, verificar si ya existe otro evento destacado
      if (formData.isFeatured && !event?.isFeatured) {
        // Obtener todos los eventos
        const allEvents = await getAllEvents(token)

        // Verificar si ya existe un evento destacado
        const featuredEvent = allEvents.find((e) => e.isFeatured && e._id !== eventId)

        if (featuredEvent) {
          setError("Ya existe un evento destacado. Solo puede haber un evento destacado a la vez.")
          setIsSubmitting(false)
          return
        }
      }

      // Asegurarse de que la URL de la imagen sea válida
      if (formData.image && !formData.image.startsWith("http")) {
        setError("La URL de la imagen no es válida. Debe comenzar con http:// o https://")
        setIsSubmitting(false)
        return
      }

      await updateEvent(eventId, formData, token)
      router.push("/admin/dashboard?tab=events")
    } catch (err: any) {
      console.error("Error updating event:", err)
      setError(err.message || "Error al actualizar el evento")
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
              <h1 className="text-3xl md:text-4xl font-bold">Editar Evento</h1>
              <Link
                href="/admin/dashboard?tab=events"
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
                <p className="mt-4">Cargando datos del evento...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-dark-gray p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-light mb-1">
                      Título del evento *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-light mb-1">
                      Descripción *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-light mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date?.toString().split("T")[0]}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-light mb-1">
                      Ubicación *
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-light mb-1">
                      Subir imagen
                    </label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-burgundy file:text-white hover:file:bg-burgundy/80"
                    />
                    {selectedImage && (
                      <div className="mt-2">
                        <img
                          src={selectedImage || "/placeholder.svg"}
                          alt="Preview"
                          className="max-h-32 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="isFeatured" className="inline-flex items-center">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        name="isFeatured"
                        checked={formData.isFeatured}
                        onChange={handleChange}
                        className="h-5 w-5 text-gold rounded-md focus:ring-gold"
                      />
                      <span className="ml-2 text-gray-light">Destacado</span>
                    </label>
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

                  <button
                    type="button"
                    onClick={() => router.push("/admin/dashboard?tab=events")}
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
