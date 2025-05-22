"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { getWebinarById, updateWebinar } from "@/services/webinar-service"
import type { Webinar, UpdateWebinarDto } from "@/services/webinar-service"

export default function EditWebinarPage() {
  const params = useParams()
  const router = useRouter()
  const webinarId = params.id as string

  const [webinar, setWebinar] = useState<Webinar | null>(null)
  const [formData, setFormData] = useState<UpdateWebinarDto>({
    title: "",
    description: "",
    date: "",
    link: "",
    image: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchWebinar = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        const webinarData = await getWebinarById(webinarId, token)
        setWebinar(webinarData)

        // Format date for input field (YYYY-MM-DDThh:mm)
        const formattedDate = new Date(webinarData.date).toISOString().slice(0, 16)

        setFormData({
          title: webinarData.title,
          description: webinarData.description,
          date: formattedDate,
          link: webinarData.link,
          image: webinarData.image || "",
        })
        setSelectedImage(webinarData.image || null)
      } catch (err: any) {
        console.error("Error fetching webinar:", err)
        setError(err.message || "Error al cargar los datos del webinar")
      } finally {
        setIsLoading(false)
      }
    }

    if (webinarId) {
      fetchWebinar()
    }
  }, [webinarId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (!formData.title || !formData.description || !formData.date || !formData.link) {
      setError("Por favor, completa todos los campos requeridos")
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await updateWebinar(webinarId, formData, token)
      setSuccessMessage("Webinar actualizado correctamente")

      // Esperar un momento para mostrar el mensaje de éxito
      setTimeout(() => {
        router.push("/admin/dashboard?tab=webinars")
      }, 1500)
    } catch (err: any) {
      console.error("Error updating webinar:", err)
      setError(err.message || "Error al actualizar el webinar")
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/admin/dashboard?tab=webinars")
  }

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">Editar Webinar</h1>

            {error && (
              <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6">
                <p className="text-white">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-900/20 border border-green-500 p-4 rounded-md mb-6">
                <p className="text-white">{successMessage}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                <p className="mt-4">Cargando datos del webinar...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-dark-gray p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-light mb-1">
                      Título del webinar *
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
                      Fecha y hora *
                    </label>
                    <input
                      type="datetime-local"
                      id="date"
                      name="date"
                      value={formData.date?.toString()}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="link" className="block text-sm font-medium text-gray-light mb-1">
                      Enlace del webinar *
                    </label>
                    <input
                      type="url"
                      id="link"
                      name="link"
                      value={formData.link}
                      onChange={handleChange}
                      placeholder="https://zoom.us/j/example"
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-light mb-1">
                      Subir imagen (opcional)
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
                    onClick={handleCancel}
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
