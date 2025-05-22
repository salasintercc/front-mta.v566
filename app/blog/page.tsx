"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, ChevronRight, User } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import LoadingScreen from "@/components/loading-screen"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { formatBlogDate, getAllBlogs } from "@/services/blog-service"

export default function BlogPage() {
  const { t, isLoaded } = useLanguage()
  const { isAuthenticated } = useAuth()
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [blogs, setBlogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isLoaded) {
      setIsPageLoaded(true)
      fetchBlogs()
    }
  }, [isLoaded])

  const fetchBlogs = async () => {
    try {
      setIsLoading(true)

      // Use the getAllBlogs function from the service
      const blogsData = await getAllBlogs()
      // Filtrar solo los blogs publicados para mostrar en la página pública
      const publishedBlogs = blogsData.filter((blog) => blog.isPublished)
      setBlogs(publishedBlogs)
    } catch (err) {
      console.error("Error fetching blogs:", err)
      setError(err.message || "Error al cargar los blogs")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para truncar texto con respeto a palabras completas
  const truncateText = (text, maxLength) => {
    if (!text) return ""
    if (text.length <= maxLength) return text

    // Cortar en la última palabra completa antes del límite
    const truncated = text.substring(0, maxLength)
    return truncated.substring(0, truncated.lastIndexOf(" ")) + "..."
  }

  if (!isPageLoaded) {
    return <LoadingScreen />
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      {/* Header */}
      <section className="relative py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl uppercase mb-6">Blog</h1>
          <p className="text-xl text-gray-light max-w-3xl mx-auto font-cormorant">
            Descubre las últimas noticias y tendencias en arquitectura.
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
              <p className="mt-4">Cargando blogs...</p>
            </div>
          ) : error ? (
            <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6 text-center">
              <p className="text-white">{error}</p>
            </div>
          ) : blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <div
                  key={blog._id}
                  className="bg-dark-gray group h-full flex flex-col border border-transparent hover:border-gold/30 transition-all duration-300 rounded-sm overflow-hidden"
                >
                  <div className="relative h-[250px] overflow-hidden">
                    {blog.image ? (
                      <Image
                        src={blog.image || "/placeholder.svg"}
                        alt={blog.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-rich-black flex items-center justify-center">
                        <span className="text-gray-light">No hay imagen</span>
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-gold px-4 py-2">
                      <p className="text-rich-black font-medium">Blog</p>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center text-gold mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">{formatBlogDate(blog.createdAt)}</span>
                    </div>
                    <div className="flex items-center text-gray-light mb-4">
                      <User className="h-4 w-4 mr-2" />
                      <span className="text-sm">{blog.author}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 line-clamp-2 leading-tight">{blog.title}</h3>
                    <p className="text-gray-light mb-6 flex-grow line-clamp-3">{truncateText(blog.content, 150)}</p>
                    <Link
                      href={`/blog/${blog._id}`}
                      className="inline-flex items-center text-gold hover:text-gold/80 font-medium mt-auto"
                    >
                      Leer más <ChevronRight className="h-5 w-5 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl mb-4">No hay blogs disponibles en este momento.</p>
              <p className="text-gray-light">Vuelve pronto para ver nuestras últimas publicaciones.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
