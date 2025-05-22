"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { getSpeakerById, updateSpeaker } from "@/services/speaker-service"
import { getAllEvents } from "@/services/event-service"
import type { Event } from "@/services/event-service"
import type { Speaker } from "@/services/speaker-service"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function EditSpeakerPage() {
  const params = useParams()
  const router = useRouter()
  const speakerId = params.id as string

  const [speaker, setSpeaker] = useState<Speaker | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    bio: "",
    image: "",
    company: "",
    eventId: "",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        // Cargar el ponente y los eventos en paralelo
        const [speakerData, eventsData] = await Promise.all([getSpeakerById(speakerId, token), getAllEvents(token)])

        setSpeaker(speakerData)
        setEvents(eventsData)

        // Inicializar el formulario con los datos del ponente
        setFormData({
          name: speakerData.name,
          position: speakerData.position,
          bio: speakerData.bio || "",
          image: speakerData.image || "",
          company: speakerData.company || "",
          eventId: speakerData.eventId,
        })
        setSelectedImage(speakerData.image || null)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Error al cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }

    if (speakerId) {
      fetchData()
    }
  }, [speakerId])

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

      await updateSpeaker(speakerId, formData, token)
      router.push("/admin/dashboard?tab=speakers")
    } catch (err: any) {
      console.error("Error updating speaker:", err)
      setError(err.message || "Error al actualizar el ponente")
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
              <h1 className="text-3xl md:text-4xl font-bold">Editar Ponente</h1>
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

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                <p className="mt-4">Cargando datos del ponente...</p>
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
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
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
