"use client"

import { useState, useEffect } from "react"
import { Calendar, MapPin, Clock, Check, LinkIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import LoginModal from "@/components/auth/login-modal"
import SuccessModal from "@/components/success-modal"
import { createTicketWithCurrentUser, checkUserRegistration } from "@/services/ticket-service"
import { getPublicWebinars, formatWebinarDate, type Webinar } from "@/services/public-webinar-service"

export default function WebinarsPage() {
  const { t, isLoaded } = useLanguage()
  const { isAuthenticated, canAccessWebinars, user } = useAuth()
  const router = useRouter()
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [subscribedWebinars, setSubscribedWebinars] = useState<string[]>([])
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [successModalData, setSuccessModalData] = useState({
    title: "",
    message: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  // Estados para webinars
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [isLoadingWebinars, setIsLoadingWebinars] = useState(true)
  const [isWebinarRegistered, setIsWebinarRegistered] = useState(false)
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      setIsPageLoaded(true)

      // Verificar si el usuario puede acceder a webinars (exhibidor o admin)
      if (!isAuthenticated || !canAccessWebinars) {
        // Redirigir a la página principal si no tiene acceso
        router.push("/unauthorized?message=Solo los exhibidores y administradores pueden acceder a los webinars")
        return
      }
    }
  }, [isLoaded, isAuthenticated, canAccessWebinars, router])

  // Cargar los webinars
  useEffect(() => {
    // Solo cargar webinars si el usuario tiene acceso
    if (isAuthenticated && canAccessWebinars) {
      const fetchWebinars = async () => {
        try {
          setIsLoadingWebinars(true)
          const fetchedWebinars = await getPublicWebinars()
          setWebinars(fetchedWebinars)

          // Seleccionar automáticamente el primer webinar si hay alguno disponible
          if (fetchedWebinars.length > 0 && !selectedEvent) {
            setSelectedEvent(fetchedWebinars[0]._id)

            // Verificar si el usuario ya está registrado en este webinar
            if (isAuthenticated) {
              checkWebinarRegistration(fetchedWebinars[0]._id)
            }
          }
        } catch (error) {
          console.error("Error fetching webinars:", error)
        } finally {
          setIsLoadingWebinars(false)
        }
      }

      fetchWebinars()
    }
  }, [isAuthenticated, canAccessWebinars, selectedEvent])

  // Verificar si el usuario ya está registrado cuando cambia la autenticación
  useEffect(() => {
    if (isAuthenticated && canAccessWebinars && selectedEvent) {
      checkWebinarRegistration(selectedEvent)
    }
  }, [isAuthenticated, canAccessWebinars, selectedEvent])

  // Función para verificar si el usuario ya está registrado en un webinar
  const checkWebinarRegistration = async (webinarId: string) => {
    if (!isAuthenticated) return

    setIsCheckingRegistration(true)
    try {
      const isRegistered = await checkUserRegistration(webinarId, "webinar")
      setIsWebinarRegistered(isRegistered)
    } catch (error) {
      console.error("Error al verificar registro en webinar:", error)
    } finally {
      setIsCheckingRegistration(false)
    }
  }

  // Modificar la función handleSubscribe para manejar correctamente el caso de un usuario ya registrado
  const handleSubscribe = async (eventId: string) => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      return
    }

    // Verificar si el usuario puede acceder a webinars
    if (!canAccessWebinars) {
      setSuccessModalData({
        title: "Acceso denegado",
        message: "Solo los exhibidores y administradores pueden registrarse en webinars.",
      })
      setIsSuccessModalOpen(true)
      return
    }

    try {
      setIsProcessing(true)

      // Verificar si el usuario ya está registrado en este webinar
      const isRegistered = await checkUserRegistration(eventId, "webinar")
      if (isRegistered) {
        // En lugar de lanzar un error, mostrar un mensaje informativo
        setSuccessModalData({
          title: "Ya estás registrado",
          message: `Ya tienes una suscripción activa para el webinar: ${webinars.find((w) => w._id === eventId)?.title}. Puedes ver tus tickets en tu panel de usuario.`,
        })
        setIsSuccessModalOpen(true)
        setIsWebinarRegistered(true) // Actualizar el estado para reflejar que está registrado
        return // Salir de la función sin intentar crear el ticket
      }

      // Obtener el webinar seleccionado
      const webinar = webinars.find((w) => w._id === eventId)

      if (!webinar) {
        throw new Error("Webinar no encontrado")
      }

      // Crear el ticket usando el servicio, especificando que es un webinar
      const result = await createTicketWithCurrentUser(
        eventId,
        webinar.title,
        webinar.description,
        "webinar", // Añadir el tipo de ticket
      )

      // Verificar si el resultado indica un registro existente
      if (result._id === "existing-registration") {
        setSuccessModalData({
          title: "Ya estás registrado",
          message: `Ya tienes una suscripción activa para el webinar: ${webinar.title}. Puedes ver tus tickets en tu panel de usuario.`,
        })
        setIsWebinarRegistered(true)
      } else {
        // Actualizar la UI
        setSubscribedWebinars([...subscribedWebinars, eventId])
        setIsWebinarRegistered(true)

        // Mostrar modal de éxito
        setSuccessModalData({
          title: "¡Registro exitoso!",
          message: `Te has registrado correctamente al webinar: ${webinar.title}`,
        })
      }

      setIsSuccessModalOpen(true)
    } catch (error) {
      console.error("Error al suscribirse al webinar:", error)

      // Mostrar un mensaje de error más descriptivo
      let errorMessage = "Hubo un error al suscribirse al webinar."
      if (error instanceof Error) {
        errorMessage += " " + error.message
      }

      // Usar el modal de éxito para mostrar el error (cambiando el estilo)
      setSuccessModalData({
        title: "Error al registrarse",
        message: errorMessage,
      })
      setIsSuccessModalOpen(true)
    } finally {
      setIsProcessing(false)
    }
  }

  // Obtener el webinar seleccionado
  const selectedWebinar = selectedEvent ? webinars.find((webinar) => webinar._id === selectedEvent) : null

  // Si el usuario no tiene acceso, no renderizar la página
  if (!isLoaded || !isAuthenticated || !canAccessWebinars) {
    return null
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      {/* Título de la sección */}
      <section className="py-12 px-4 md:px-8 bg-dark-gray">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl uppercase mb-4">Webinars</h1>
          <p className="text-xl text-gray-light max-w-3xl mx-auto font-cormorant">
            Descubre nuestros próximos webinars y regístrate para participar en ellos.
          </p>
          {user?.role === "admin" && (
            <div className="mt-4 inline-block bg-burgundy/20 border border-burgundy px-4 py-2 text-sm">
              Estás viendo esta página como administrador. Los exhibidores también tienen acceso a esta sección.
            </div>
          )}
        </div>
      </section>

      {/* Selector de Webinars */}
      <section className="py-8 px-4 md:px-8 bg-rich-black">
        <div className="max-w-7xl mx-auto">
          {isLoadingWebinars ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
              <p className="mt-4">Cargando webinars...</p>
            </div>
          ) : webinars.length > 0 ? (
            <div className="flex flex-wrap gap-4 justify-center">
              {webinars.map((webinar) => (
                <button
                  key={webinar._id}
                  onClick={() => {
                    setSelectedEvent(webinar._id)
                    if (isAuthenticated) {
                      checkWebinarRegistration(webinar._id)
                    }
                  }}
                  className={`px-6 py-2 transition-colors ${
                    selectedEvent === webinar._id
                      ? "bg-burgundy text-white"
                      : "bg-dark-gray text-white hover:bg-burgundy/20"
                  }`}
                >
                  {webinar.title}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p>No hay webinars disponibles en este momento.</p>
            </div>
          )}
        </div>
      </section>

      {/* Contenido del Webinar Seleccionado */}
      {selectedWebinar ? (
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-[400px] md:h-[500px] overflow-hidden bg-dark-gray flex items-center justify-center">
                {selectedWebinar.image ? (
                  <img
                    src={selectedWebinar.image || "/placeholder.svg"}
                    alt={selectedWebinar.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-6xl text-gray-light/20">{t("placeholder.eventImage")}</div>
                    <div className="text-sm text-gray-light/50 mt-2">webinar.placeholder</div>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">{selectedWebinar.title}</h1>
                <div className="flex items-center text-gold mb-6">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span>{formatWebinarDate(selectedWebinar.date)}</span>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-2 text-gold mt-1" />
                    <div>
                      <p className="font-medium">{t("preview.platform")}</p>
                      <p className="text-gray-light">{t("preview.onlineEvent")}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-2 text-gold mt-1" />
                    <div>
                      <p className="font-medium">{t("common.schedule")}</p>
                      <p className="text-gray-light">{formatWebinarDate(selectedWebinar.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <LinkIcon className="h-5 w-5 mr-2 text-gold mt-1" />
                    <div>
                      <p className="font-medium">Enlace</p>
                      <a
                        href={selectedWebinar.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold hover:underline"
                      >
                        Acceder al webinar
                      </a>
                    </div>
                  </div>
                </div>

                <p className="text-gray-light mb-8">{selectedWebinar.description}</p>

                {/* Mostrar mensaje si el usuario ya está registrado */}
                {isAuthenticated && isWebinarRegistered ? (
                  <div className="bg-green-900/20 border border-green-500 p-4 rounded-md mb-6 flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p>
                      Ya estás registrado en este webinar. Puedes ver tus tickets en tu{" "}
                      <a href="/users/dashboard" className="text-gold hover:underline">
                        panel de usuario
                      </a>
                      .
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(selectedWebinar._id)}
                    disabled={isProcessing || isCheckingRegistration}
                    className="bg-burgundy hover:bg-burgundy/90 text-white px-8 py-3 text-lg font-medium transition-colors inline-block disabled:opacity-50"
                  >
                    {isProcessing ? "Procesando..." : "Suscribirse al webinar"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Detalles del evento</h2>
              <div className="bg-dark-gray p-8">
                <p className="text-gray-light mb-4">{selectedWebinar.description}</p>
                <p className="text-gray-light mb-4">
                  Este webinar se realizará en línea a través de la plataforma indicada. Recibirás un correo electrónico
                  con los detalles de acceso antes del evento.
                </p>
                <p className="text-gray-light mb-4">
                  Para participar, necesitarás una conexión a internet estable y un dispositivo con micrófono y cámara
                  (opcional).
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : !isLoadingWebinars && webinars.length === 0 ? (
        <section className="py-16 px-4 md:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">No hay webinars disponibles</h2>
            <p className="text-gray-light mb-8">
              Actualmente no hay webinars programados. Por favor, vuelve a consultar más tarde.
            </p>
          </div>
        </section>
      ) : null}

      <Footer />

      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} redirectPath="/webinars" />

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={successModalData.title}
        message={successModalData.message}
        isError={successModalData.title.toLowerCase().includes("error")} // Detectar si es un error por el título
      />
    </main>
  )
}
