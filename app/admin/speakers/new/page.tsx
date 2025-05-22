"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { createSpeaker } from "@/services/speaker-service"
import { getAllEvents } from "@/services/event-service"
import type { Event } from "@/services/event-service"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function CreateSpeakerPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    position: "",
    bio: "",
    image: "",
    company: "",
    eventId: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Cargar los eventos disponibles
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        const eventsData = await getAllEvents(token)
        setEvents(eventsData)

        // Seleccionar el primer evento por defecto si hay eventos disponibles
        if (eventsData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            eventId: eventsData[0]._id,
          }))
        }
      } catch (err: any) {
        console.error("Error fetching events:", err)
        setError(err.message || "Error al cargar los eventos")
      } finally {
        setIsLoadingEvents(false)
      }
    }

    fetchEvents()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validación básica
    if (!formData.name || !formData.position || !formData.eventId) {
      setError("Por favor, completa todos los campos requeridos")
      return
    }

    // Validar que se haya subido una imagen
    if (!formData.image) {
      setError("Por favor, sube una imagen para el ponente")
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Asegurarse de que la URL de la imagen sea válida
      if (formData.image && !formData.image.startsWith("http")) {
        setError("La URL de la imagen no es válida. Debe comenzar con http:// o https://")
        setIsSubmitting(false)
        return
      }

      await createSpeaker(formData, token)
      router.push("/admin/dashboard?tab=speakers")
    } catch (err: any) {
      console.error("Error creating speaker:", err)
      setError(err.message || "Error al crear el ponente")
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
              <h1 className="text-3xl md:text-4xl font-bold">Crear Nuevo Ponente</h1>
              <Link
                href="/admin/dashboard?tab=speakers"
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

            {isLoadingEvents ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                <p className="mt-4">Cargando eventos...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-dark-gray p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-light mb-1">
                      Nombre *
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

                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-light mb-1">
                      Cargo/Posición *
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-light mb-1">
                      Empresa/Organización
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
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
                        <Image
                          src={selectedImage || "/placeholder.svg"}
                          alt="Preview"
                          width={100}
                          height={100}
                          className="max-h-32 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-light mb-1">
                      Biografía
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={5}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                    />
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
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Creando..." : "Crear Ponente"}
                  </button>

                  <Link
                    href="/admin/dashboard?tab=speakers"
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
