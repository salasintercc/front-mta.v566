"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { getBlogById, updateBlog } from "@/services/blog-service"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditBlogPage() {
  const params = useParams()
  const router = useRouter()
  const blogId = params.id as string

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    author: "",
    image: "",
    isPublished: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        const blogData = await getBlogById(blogId, token)
        setFormData({
          title: blogData.title,
          content: blogData.content,
          author: blogData.author,
          image: blogData.image || "",
          isPublished: blogData.isPublished,
        })
        setSelectedImage(blogData.image || null)
      } catch (err: any) {
        console.error("Error fetching blog:", err)
        setError(err.message || "Error al cargar los datos del blog")
      } finally {
        setIsLoading(false)
      }
    }

    if (blogId) {
      fetchBlog()
    }
  }, [blogId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
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
    if (!formData.title || !formData.content || !formData.author) {
      setError("Por favor, completa todos los campos requeridos")
      return
    }

    // Validación de la imagen
    if (!formData.image) {
      setError("Por favor, sube una imagen para el blog")
      return
    }

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await updateBlog(blogId, formData, token)

      // Usar router.push con replace: true para evitar problemas de navegación
      router.push("/admin/dashboard?tab=blogs", { scroll: false })
    } catch (err: any) {
      console.error("Error updating blog:", err)
      setError(err.message || "Error al actualizar el blog")
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
              <h1 className="text-3xl md:text-4xl font-bold">Editar Blog</h1>
              <Link
                href="/admin/dashboard?tab=blogs"
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
                <p className="mt-4">Cargando datos del blog...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-dark-gray p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-light mb-1">
                      Título *
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
                    <label htmlFor="author" className="block text-sm font-medium text-gray-light mb-1">
                      Autor *
                    </label>
                    <input
                      type="text"
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-light mb-1">
                      Imagen *
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
                    <label htmlFor="content" className="block text-sm font-medium text-gray-light mb-1">
                      Contenido *
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      rows={10}
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublished"
                      name="isPublished"
                      checked={formData.isPublished}
                      onChange={handleChange}
                      className="h-4 w-4 text-burgundy focus:ring-burgundy border-gray-700 rounded"
                    />
                    <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-light">
                      Publicado
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

                  <Link
                    href="/admin/dashboard?tab=blogs"
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
