"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, User, ArrowLeft, ChevronRight } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import LoadingScreen from "@/components/loading-screen"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { getBlogById, getAllBlogs, formatBlogDate } from "@/services/blog-service"
import LoginModal from "@/components/auth/login-modal"

export default function BlogDetailPage() {
  const { t, isLoaded } = useLanguage()
  const { isAuthenticated } = useAuth()
  const params = useParams()
  const router = useRouter()
  const blogId = params.id as string

  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [blog, setBlog] = useState<any>(null)
  const [relatedBlogs, setRelatedBlogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isLoaded) {
      setIsPageLoaded(true)
      fetchBlog()
    }
  }, [isLoaded, blogId])

  const fetchBlog = async () => {
    try {
      setIsLoading(true)

      // Get token if available, but don't require it
      const token = localStorage.getItem("token")

      // Fetch the blog, passing the token if available
      const blogData = await getBlogById(blogId, token)
      setBlog(blogData)

      // Fetch related blogs
      const blogsData = await getAllBlogs()
      // Filter for published blogs and exclude current blog
      const filteredBlogs = blogsData.filter((b) => b.isPublished && b._id !== blogId).slice(0, 3) // Limit to 3 related blogs
      setRelatedBlogs(filteredBlogs)
    } catch (err) {
      console.error("Error fetching blog:", err)
      setError(err.message || "Error al cargar el blog")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para renderizar el contenido con saltos de línea
  const renderContent = (content: string) => {
    if (!content) return null
    return content.split("\n").map((paragraph, index) => (
      <p key={index} className="mb-4">
        {paragraph}
      </p>
    ))
  }

  if (!isPageLoaded) {
    return <LoadingScreen />
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <section className="py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Botón de volver */}
          <Link href="/blog" className="inline-flex items-center text-gold hover:text-gold/80 mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Volver a blogs</span>
          </Link>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
              <p className="mt-4">Cargando blog...</p>
            </div>
          ) : error ? (
            <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6 text-center">
              <p className="text-white">{error}</p>
            </div>
          ) : blog ? (
            <article className="bg-dark-gray rounded-sm overflow-hidden border border-transparent">
              {/* Imagen del blog */}
              {blog.image ? (
                <div className="relative h-[400px] w-full">
                  <Image src={blog.image || "/placeholder.svg"} alt={blog.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="h-[200px] bg-rich-black flex items-center justify-center">
                  <p className="text-gray-light">No hay imagen disponible</p>
                </div>
              )}

              {/* Contenido del blog */}
              <div className="p-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-6">{blog.title}</h1>

                <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-light">
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

                <div className="prose prose-invert max-w-none text-gray-light leading-relaxed">
                  {renderContent(blog.content)}
                </div>
              </div>
            </article>
          ) : (
            <div className="text-center py-8">
              <p>No se encontró el blog</p>
            </div>
          )}

          {/* Blogs relacionados */}
          {relatedBlogs.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-8">Artículos relacionados</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedBlogs.map((relatedBlog) => (
                  <div
                    key={relatedBlog._id}
                    className="bg-dark-gray group h-full flex flex-col border border-transparent hover:border-gold/30 transition-all duration-300 rounded-sm overflow-hidden"
                  >
                    <div className="relative h-[200px] overflow-hidden">
                      {relatedBlog.image ? (
                        <Image
                          src={relatedBlog.image || "/placeholder.svg"}
                          alt={relatedBlog.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-rich-black flex items-center justify-center">
                          <span className="text-gray-light">No hay imagen</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold mb-2 line-clamp-2">{relatedBlog.title}</h3>
                      <Link
                        href={`/blog/${relatedBlog._id}`}
                        className="inline-flex items-center text-gold hover:text-gold/80 text-sm mt-auto"
                      >
                        Leer más <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false)
          if (isAuthenticated) {
            fetchBlog()
          }
        }}
        redirectPath={`/blog/${blogId}`}
      />

      <Footer />
    </main>
  )
}
