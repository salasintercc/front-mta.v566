"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AuthGuard from "@/components/route-guards/auth-guard"
import { getWebinarById } from "@/services/webinar-service"
import type { Webinar } from "@/services/webinar-service"
import { Calendar, Clock, LinkIcon, Edit, ArrowLeft } from "lucide-react"

export default function WebinarDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const webinarId = params.id as string

  const [webinar, setWebinar] = useState<Webinar | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleBack = () => {
    router.push("/admin/dashboard?tab=webinars")
  }

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-light hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Volver a la lista de webinars</span>
            </button>

            {error && (
              <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6">
                <p className="text-white">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                <p className="mt-4 text-gray-light">Cargando datos del webinar...</p>
              </div>
            ) : webinar ? (
              <div className="bg-dark-gray rounded-lg overflow-hidden">
                <div className="relative h-48 md:h-64 w-full">
                  <Image
                    src={webinar.image || "/placeholder.svg?height=400&width=800&text=Webinar"}
                    alt={webinar.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-gray to-transparent"></div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h1 className="text-3xl md:text-4xl font-bold">{webinar.title}</h1>
                    <Link
                      href={`/admin/webinars/${webinarId}/edit`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center text-gray-light">
                      <Calendar className="h-4 w-4 mr-2 text-gold" />
                      <span>{formatDate(webinar.date)}</span>
                    </div>
                    <div className="flex items-center text-gray-light">
                      <Clock className="h-4 w-4 mr-2 text-gold" />
                      <span>{formatTime(webinar.date)}</span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">Descripción</h2>
                    <p className="text-gray-light whitespace-pre-line">{webinar.description}</p>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">Enlace</h2>
                    <a
                      href={webinar.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      <span>{webinar.link}</span>
                    </a>
                  </div>

                  <div className="border-t border-gray-700 pt-6">
                    <h2 className="text-xl font-semibold mb-4">Información adicional</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-light">ID del webinar</p>
                        <p className="font-mono text-sm">{webinar._id}</p>
                      </div>
                      <div>
                        <p className="text-gray-light">Creado</p>
                        <p>{webinar.createdAt ? formatDate(webinar.createdAt) : "No disponible"}</p>
                      </div>
                      <div>
                        <p className="text-gray-light">Última actualización</p>
                        <p>{webinar.updatedAt ? formatDate(webinar.updatedAt) : "No disponible"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-dark-gray rounded-lg">
                <h3 className="text-xl font-bold mb-2">Webinar no encontrado</h3>
                <p className="text-gray-light mb-6">No se pudo encontrar el webinar solicitado.</p>
                <button
                  onClick={handleBack}
                  className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Volver a la lista de webinars
                </button>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </AuthGuard>
  )
}
