"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { getBlogById, formatBlogDate } from "@/services/blog-service"
import { ArrowLeft, Edit, Calendar, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ViewBlogPage() {
  const params = useParams()
  const router = useRouter()
  const blogId = params.id as string

  const [blog, setBlog] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        const blogData = await getBlogById(blogId, token)
        setBlog(blogData)
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

  // Función para renderizar el contenido con saltos de línea
  const renderContent = (content: string) => {
    return content.split("\n").map((paragraph, index) => (
      <p key={index} className="mb-4">
        {paragraph}
      </p>
    ))
  }

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl md:text-4xl font-bold">Vista Previa del Blog</h1>
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
                <p className="mt-4">Cargando blog...</p>
              </div>
            ) : blog ? (
              <div className="bg-dark-gray rounded-lg overflow-hidden">
                {/* Imagen del blog */}
                {blog.image ? (
                  <div className="relative h-[300px] w-full">
                    <Image src={blog.image || "/placeholder.svg"} alt={blog.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-[300px] bg-rich-black flex items-center justify-center">
                    <p className="text-gray-light">No hay imagen disponible</p>
                  </div>
                )}

                {/* Contenido del blog */}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{blog.title}</h2>
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        blog.isPublished
                          ? "bg-green-900/20 text-green-500 border border-green-500/30"
                          : "bg-yellow-900/20 text-yellow-500 border border-yellow-500/30"
                      }`}
                    >
                      {blog.isPublished ? "Publicado" : "Borrador"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-light">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gold" />
                      <span>{blog.author}</span>
                    </div>
                    {blog.createdAt && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gold" />
                        <span>{formatBlogDate(blog.createdAt)}</span>
                      </div>
                    )}
                  </div>

                  <div className="prose prose-invert max-w-none">{renderContent(blog.content)}</div>

                  <div className="mt-8 flex justify-end">
                    <Link
                      href={`/admin/blogs/${blogId}/edit`}
                      className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar Blog</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p>No se encontró el blog</p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </AuthGuard>
  )
}
