"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Calendar, MapPin, Clock, Users, Check, X } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import LoginModal from "@/components/auth/login-modal"
import SuccessModal from "@/components/success-modal"
import { createTicketWithCurrentUser, checkUserRegistration } from "@/services/ticket-service"
import { getPublicEvents, type Event, formatEventDate } from "@/services/public-event-service"
import { getPublicWebinars, formatWebinarDate, type Webinar } from "@/services/public-webinar-service"
import { getTicketTypesByEvent } from "@/services/ticket-type-service"
import { UserRole } from "@/types/user"

// Añadir estas importaciones al inicio del archivo
import ExhibitorContactModal from "@/components/exhibitor/exhibitor-contact-modal"
import { API_CONFIG } from "@/config/api"
import { PaymentService } from "@/services/payment-service"

// Añadir después de las interfaces existentes
interface TicketType {
  _id: string
  name: string
  price: number
  stock: number
  benefits?: string[]
  eventId: string
  createdAt?: string
  updatedAt?: string
  description?: string // Campo adicional para mantener compatibilidad
  features?: string[] // Campo adicional para mantener compatibilidad
}

interface ModalState {
  title: string
  message: string
  isOpen: boolean
}

export default function TicketsPage() {
  const { t, isLoaded } = useLanguage()
  const { isAuthenticated, user, getAccessToken } = useAuth()
  const router = useRouter()

  // Estados para el formulario de pre-registro
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [showPreRegister, setShowPreRegister] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    position: "",
  })
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalState, setModalState] = useState<ModalState>({
    title: "",
    message: "",
    isOpen: false
  })

  // Estados para eventos
  const [events, setEvents] = useState<Event[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedEvents, setSelectedEvents] = useState<{ [key: string]: boolean }>({})
  const [totalPrice, setTotalPrice] = useState(0)
  const [isEventRegistered, setIsEventRegistered] = useState(false)
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false)

  // Añadir un nuevo estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState<"events" | "webinars">("events")

  // Añadir estados para webinars
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [isLoadingWebinars, setIsLoadingWebinars] = useState(true)
  const [selectedWebinarId, setSelectedWebinarId] = useState<string | null>(null)
  const [isWebinarRegistered, setIsWebinarRegistered] = useState(false)

  // Añadir estos estados dentro de la función del componente, junto a los otros estados
  const [isExhibitorContactModalOpen, setIsExhibitorContactModalOpen] = useState(false)
  const [exhibitorEventData, setExhibitorEventData] = useState({ id: "", name: "" })

  // Reemplazar el array hardcodeado de ticketTypes con este estado
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [isLoadingTicketTypes, setIsLoadingTicketTypes] = useState(false)

  // Cargar eventos y webinars desde la API
  const fetchData = useCallback(async () => {
    try {
      if (activeTab === "events") {
        setIsLoadingEvents(true)
        const fetchedEvents = await getPublicEvents()
        setEvents(fetchedEvents)

        // Seleccionar automáticamente el primer evento si hay alguno disponible
        if (fetchedEvents.length > 0 && !selectedEventId) {
          setSelectedEventId(fetchedEvents[0]._id)
          setSelectedEvents({ [fetchedEvents[0]._id]: true })

          // Verificar si el usuario ya está registrado en este evento
          if (isAuthenticated) {
            checkEventRegistration(fetchedEvents[0]._id)
          }
        }

        setIsLoadingEvents(false)
      } else {
        setIsLoadingWebinars(true)
        const fetchedWebinars = await getPublicWebinars()
        setWebinars(fetchedWebinars)

        // Seleccionar automáticamente el primer webinar si hay alguno disponible
        if (fetchedWebinars.length > 0 && !selectedWebinarId) {
          setSelectedWebinarId(fetchedWebinars[0]._id)

          // Verificar si el usuario ya está registrado en este webinar
          if (isAuthenticated) {
            checkWebinarRegistration(fetchedWebinars[0]._id)
          }
        }

        setIsLoadingWebinars(false)
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error)
      if (activeTab === "events") {
        setIsLoadingEvents(false)
      } else {
        setIsLoadingWebinars(false)
      }
    }
  }, [activeTab, selectedEventId, isAuthenticated])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Verificar si el usuario ya está registrado cuando cambia la autenticación
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "events" && selectedEventId) {
        checkEventRegistration(selectedEventId)
      } else if (activeTab === "webinars" && selectedWebinarId) {
        checkWebinarRegistration(selectedWebinarId)
      }
    }
  }, [isAuthenticated, activeTab, selectedEventId, selectedWebinarId])

  // Función para verificar si el usuario ya está registrado en un evento
  const checkEventRegistration = async (eventId: string) => {
    if (!isAuthenticated) return

    setIsCheckingRegistration(true)
    try {
      const isRegistered = await checkUserRegistration(eventId, "event")
      setIsEventRegistered(isRegistered)
    } catch (error) {
      console.error("Error al verificar registro en evento:", error)
    } finally {
      setIsCheckingRegistration(false)
    }
  }

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

  // Añadir esta función dentro del componente, junto a las otras funciones de manejo
  const handleExhibitorStandRequest = (eventId: string, eventName: string) => {
    // Guardar los datos del evento actual
    setExhibitorEventData({ id: eventId, name: eventName })

    // Abrir el modal
    setIsExhibitorContactModalOpen(true)
  }

  // Modificar esta función para eliminar el segundo modal de éxito
  const handleExhibitorContactSuccess = () => {
    // Actualizar el estado para mostrar que el usuario ya está registrado
    setIsEventRegistered(true)

    // Crear un ticket virtual para el exhibidor (esto asegura que se registre como participante)
    if (activeTab === "events" && selectedEventId) {
      const selectedEvent = events.find((e) => e._id === selectedEventId)
      if (selectedEvent) {
        // Registrar al exhibidor como participante del evento
        try {
          createTicketWithCurrentUser(
            selectedEventId,
            `Stand para exhibidor - ${selectedEvent.title}`,
            `Solicitud de stand para el evento: ${selectedEvent.title}`,
            "event"
          )
        } catch (error) {
          console.error("Error al registrar exhibidor:", error)
        }
      }
    }
  }

  // Añadir esta función after checkWebinarRegistration
  const fetchTicketTypes = async (eventId: string) => {
    if (!eventId) return

    try {
      setIsLoadingTicketTypes(true)
      const types = await getTicketTypesByEvent(eventId)
      console.log("Tipos de tickets cargados:", types)
      
      if (!types || types.length === 0) {
        console.warn("No se encontraron tipos de tickets para el evento:", eventId);
        setTicketTypes([]);
        return;
      }
      
      setTicketTypes(types)
    } catch (error) {
      console.error("Error al cargar los tipos de tickets:", error)
      setTicketTypes([]) // No usar datos de respaldo para identificar problemas reales
    } finally {
      setIsLoadingTicketTypes(false)
    }
  }

  // Efecto para cargar los tipos de tickets cuando se selecciona un evento
  useEffect(() => {
    if (activeTab === "events" && selectedEventId) {
      console.log("Cargando tipos de tickets para el evento:", selectedEventId);
      fetchTicketTypes(selectedEventId);
    } else if (activeTab === "webinars" && selectedWebinarId) {
      console.log("Cargando tipos de tickets para el webinar:", selectedWebinarId);
      fetchTicketTypes(selectedWebinarId);
    }
  }, [activeTab, selectedEventId, selectedWebinarId]);

  // Calcular precio total cuando cambia la selección
  useEffect(() => {
    if (!selectedTicket) {
      setTotalPrice(0)
      return
    }

    const ticketType = ticketTypes.find((ticket) => ticket._id === selectedTicket)
    if (!ticketType) {
      setTotalPrice(0)
      return
    }

    let price = ticketType.price

    // Añadir precios de eventos adicionales seleccionados (precio fijo de 50€ por evento adicional)
    if (activeTab === "events") {
      const mainEventId = selectedEventId

      // Contar cuántos eventos adicionales están seleccionados
      const additionalEventsCount = Object.entries(selectedEvents).filter(
        ([eventId, isSelected]) => isSelected && eventId !== mainEventId,
      ).length

      // Añadir 50€ por cada evento adicional
      price += additionalEventsCount * 50
    }

    setTotalPrice(price)
  }, [selectedTicket, selectedEvents, selectedEventId, activeTab, ticketTypes])

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Manejar cambios en la selección de eventos
  const handleEventSelection = (eventId: string) => {
    setSelectedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }))
  }

  // Modificar la función handleSelectMainEvent
  const handleSelectMainEvent = (eventId: string) => {
    setSelectedEventId(eventId)

    // Actualizar los eventos seleccionados para incluir el evento principal
    setSelectedEvents((prev) => ({
      ...prev,
      [eventId]: true,
    }))

    // Resetear la selección de tickets cuando se cambia el evento principal
    setSelectedTicket(null)
    setTotalPrice(0)

    // Verificar si el usuario ya está registrado en este evento
    if (isAuthenticated) {
      checkEventRegistration(eventId)
    }

    // Cargar los tipos de tickets para este evento
    fetchTicketTypes(eventId)
  }

  // Modificar la función handleSelectWebinar
  const handleSelectWebinar = (webinarId: string) => {
    setSelectedWebinarId(webinarId)

    // Resetear la selección de tickets cuando se cambia el webinar
    setSelectedTicket(null)
    setTotalPrice(0)

    // Verificar si el usuario ya está registrado en este webinar
    if (isAuthenticated) {
      checkWebinarRegistration(webinarId)
    }

    // Cargar los tipos de tickets para este webinar
    fetchTicketTypes(webinarId)
  }

  // Seleccionar un ticket
  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicket(ticketId)
    if (isAuthenticated) {
      // Si el usuario está autenticado, mostrar selección de eventos adicionales
      // La reserva se hará después de seleccionar eventos
    } else {
      // Si no está autenticado, mostrar formulario de pre-registro
      setShowPreRegister(true)
    }
  }

  // Pre-registrar y guardar datos
  const handlePreRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Guardar datos en localStorage para recuperarlos después del login
      localStorage.setItem(
        "preRegistrationData",
        JSON.stringify({
          ...formData,
          ticketType: selectedTicket,
          selectedEvents: selectedEvents,
          selectedEventId: selectedEventId,
          activeTab: activeTab,
          selectedWebinarId: selectedWebinarId,
        }),
      )

      // Mostrar modal de login/registro
      setIsLoginModalOpen(true)
      setShowPreRegister(false)
    } catch (error) {
      console.error("Error al pre-registrar:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modificar la función handleReserveTicket para usar el PaymentService
  const handleReserveTicket = async () => {
    try {
      setIsSubmitting(true)

      // Obtener el ticket seleccionado
      const ticket = ticketTypes.find((t) => t._id === selectedTicket)
      if (!ticket) {
        throw new Error("No se ha seleccionado un ticket válido")
      }

      // Verificar si el usuario ya está registrado
      if (activeTab === "events") {
        if (isEventRegistered) {
          setModalState({
            title: "Ya estás registrado",
            message: `Ya tienes un ticket activo para este evento. Puedes ver tus tickets en tu panel de usuario.`,
            isOpen: true
          })
          return
        }
      } else {
        if (isWebinarRegistered) {
          setModalState({
            title: "Ya estás registrado",
            message: `Ya tienes una suscripción activa para este webinar. Puedes ver tus tickets en tu panel de usuario.`,
            isOpen: true
          })
          return
        }
      }

      // Verificar si el usuario es un visitante
      const isVisitor = user?.role === UserRole.VISITOR

      if (activeTab === "events") {
        if (!selectedEventId) {
          throw new Error("No se ha seleccionado un evento válido")
        }

        const selectedEvent = events.find((e) => e._id === selectedEventId)
        if (!selectedEvent) {
          throw new Error("Evento no encontrado")
        }

        // Crear descripción con eventos seleccionados
        const additionalEvents = Object.entries(selectedEvents)
          .filter(([eventId, isSelected]) => isSelected && eventId !== selectedEventId)
          .map(([eventId, _]) => {
            const event = events.find((e) => e._id === eventId)
            return event ? event.title : eventId
          })
          .join(", ")

        const description = `Reserva de ticket tipo ${ticket.name} para ${selectedEvent.title}. ${
          additionalEvents ? `Eventos adicionales: ${additionalEvents}.` : ""
        } Precio: €${totalPrice}`

        // Crear el ticket usando el servicio
        const createdTicket = await createTicketWithCurrentUser(
          selectedEventId,
          `Ticket ${ticket.name} - ${selectedEvent.title}`,
          description,
          "event",
        )

        // Si el ticket está pendiente de pago, proceder directamente con el pago
        if (createdTicket.status === "pending_payment") {
          // Guardar el ID del ticket en localStorage
          localStorage.setItem("pendingTicketId", createdTicket._id)

          // Preparar los parámetros para el pago
          const origin = typeof window !== "undefined" ? window.location.origin : ""
          const redirectUrl = `${origin}/payment/success?ticketId=${createdTicket._id}&type=event`
          const webhookUrl = `${API_CONFIG.getBackendUrl()}${API_CONFIG.endpoints.paymentWebhook}`

          try {
            const paymentResponse = await PaymentService.createPayment({
              amount: totalPrice.toString(),
              description: `Ticket para ${selectedEvent.title}`,
              redirectUrl,
              webhookUrl,
            })

            if (paymentResponse.paymentUrl) {
              window.location.href = paymentResponse.paymentUrl
              return
            } else {
              throw new Error("No se pudo obtener la URL de pago")
            }
          } catch (paymentError) {
            console.error("Error al procesar el pago:", paymentError)
            throw new Error("Error al procesar el pago. Por favor, inténtalo de nuevo.")
          }
        }

        // Si el usuario es un visitante, proceder con el pago
        if (isVisitor) {
          if (!createdTicket || !createdTicket._id) {
            throw new Error("Error al crear el ticket")
          }

          // Guardar el ID del ticket en localStorage
          localStorage.setItem("pendingTicketId", createdTicket._id)

          // Preparar los parámetros para el pago
          const origin = typeof window !== "undefined" ? window.location.origin : ""
          const redirectUrl = `${origin}/payment/success?ticketId=${createdTicket._id}&type=event`
          const webhookUrl = `${API_CONFIG.getBackendUrl()}${API_CONFIG.endpoints.paymentWebhook}`

          try {
            const paymentResponse = await PaymentService.createPayment({
              amount: totalPrice.toString(),
              description: `Ticket para ${selectedEvent.title}`,
              redirectUrl,
              webhookUrl,
            })

            if (paymentResponse.paymentUrl) {
              window.location.href = paymentResponse.paymentUrl
              return
            } else {
              throw new Error("No se pudo obtener la URL de pago")
            }
          } catch (paymentError) {
            console.error("Error al procesar el pago:", paymentError)
            throw new Error("Error al procesar el pago. Por favor, inténtalo de nuevo.")
          }
        }

        // Para usuarios no visitantes, mostrar éxito directamente
        setIsEventRegistered(true)
        setModalState({
          title: "¡Reserva exitosa!",
          message: `Has reservado un ticket ${ticket.name} para el evento seleccionado. Te redirigiremos a tu panel de usuario.`,
          isOpen: true
        })
      } else {
        // Lógica para webinars
        if (!selectedWebinarId) {
          throw new Error("No se ha seleccionado un webinar válido")
        }

        const selectedWebinar = webinars.find((w) => w._id === selectedWebinarId)
        if (!selectedWebinar) {
          throw new Error("Webinar no encontrado")
        }

        const description = `Reserva para webinar: ${selectedWebinar.title}. Fecha: ${formatWebinarDate(
          selectedWebinar.date,
        )}. Precio: €${totalPrice}`

        // Crear el ticket para el webinar
        const createdTicket = await createTicketWithCurrentUser(
          selectedWebinarId,
          `Webinar: ${selectedWebinar.title}`,
          description,
          "webinar",
        )

        // Si el usuario es un visitante, proceder con el pago
        if (isVisitor) {
          if (!createdTicket || !createdTicket._id) {
            throw new Error("Error al crear el ticket")
          }

          // Guardar el ID del ticket en localStorage
          localStorage.setItem("pendingTicketId", createdTicket._id)

          // Preparar los parámetros para el pago
          const origin = typeof window !== "undefined" ? window.location.origin : ""
          const redirectUrl = `${origin}/payment/success?ticketId=${createdTicket._id}&type=webinar`
          const webhookUrl = `${API_CONFIG.getBackendUrl()}${API_CONFIG.endpoints.paymentWebhook}`

          try {
            const paymentResponse = await PaymentService.createPayment({
              amount: totalPrice.toString(),
              description: `Webinar: ${selectedWebinar.title}`,
              redirectUrl,
              webhookUrl,
            })

            if (paymentResponse.paymentUrl) {
              window.location.href = paymentResponse.paymentUrl
              return
            } else {
              throw new Error("No se pudo obtener la URL de pago")
            }
          } catch (paymentError) {
            console.error("Error al procesar el pago:", paymentError)
            throw new Error("Error al procesar el pago. Por favor, inténtalo de nuevo.")
          }
        }

        // Para usuarios no visitantes, mostrar éxito directamente
        setIsWebinarRegistered(true)
        setModalState({
          title: "¡Registro exitoso!",
          message: `Te has registrado correctamente al webinar: ${selectedWebinar.title}. Te redirigiremos a tu panel de usuario.`,
          isOpen: true
        })
      }
    } catch (error) {
      console.error(`Error al reservar ${activeTab === "events" ? "ticket" : "webinar"}:`, error)
      setModalState({
        title: "Error en la reserva",
        message:
          error instanceof Error
            ? error.message
            : "Hubo un error al realizar la reserva. Por favor, inténtalo de nuevo.",
        isOpen: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Añadir la función handleReserveWebinar después de handleReserveTicket

  // Función específica para reservar webinars
  const handleReserveWebinarFunction = async () => {
    try {
      setIsSubmitting(true)

      // Verificar si el usuario ya está registrado en este webinar
      if (isWebinarRegistered) {
        setModalState({
          title: "Ya estás registrado",
          message: `Ya tienes una suscripción activa para este webinar. Puedes ver tus tickets en tu panel de usuario.`,
          isOpen: true
        })
        return // Salir de la función sin intentar crear el ticket
      }

      // Verificar que hay un webinar seleccionado
      if (!selectedWebinarId) {
        throw new Error("No se ha seleccionado un webinar válido")
      }

      const selectedWebinar = webinars.find((w) => w._id === selectedWebinarId)
      if (!selectedWebinar) {
        throw new Error("Webinar no encontrado")
      }

      const description = `Reserva para webinar: ${selectedWebinar.title}. Fecha: ${formatWebinarDate(
        selectedWebinar.date,
      )}`

      // Crear el ticket usando el servicio con el ID del webinar seleccionado
      await createTicketWithCurrentUser(
        selectedWebinarId,
        `Webinar: ${selectedWebinar.title}`,
        description,
        "webinar", // Especificar que es un webinar
      )

      // Actualizar el estado para reflejar que el usuario ahora está registrado
      setIsWebinarRegistered(true)

      // Mostrar modal de éxito
      setModalState({
        title: "¡Registro exitoso!",
        message: `Te has registrado correctamente al webinar: ${selectedWebinar.title}. Te redirigiremos a tu panel de usuario.`,
        isOpen: true
      })
    } catch (error) {
      console.error("Error al registrarse al webinar:", error)

      // Mostrar mensaje de error más amigable
      setModalState({
        title: "Error en el registro",
        message:
          error instanceof Error
            ? error.message
            : "Hubo un error al registrarse al webinar. Por favor, inténtalo de nuevo.",
        isOpen: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Guardar la selección actual antes de abrir el modal de login
  const handleOpenLoginModal = () => {
    // Guardar la selección actual en localStorage
    localStorage.setItem(
      "ticketSelectionData",
      JSON.stringify({
        activeTab,
        selectedEventId,
        selectedWebinarId,
      }),
    )

    // Abrir el modal de login
    setIsLoginModalOpen(true)
  }

  // Cerrar el modal de login y procesar la reserva si el usuario se autenticó
  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false)

    // Si el usuario se autenticó, procesar la reserva o recuperar la selección
    if (isAuthenticated) {
      // Primero intentar recuperar datos de pre-registro (si venía del formulario)
      const savedData = localStorage.getItem("preRegistrationData")
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setSelectedTicket(parsedData.ticketType)
        setSelectedEvents(parsedData.selectedEvents || {})
        setSelectedEventId(parsedData.selectedEventId || null)
        setActiveTab(parsedData.activeTab || "events")
        setSelectedWebinarId(parsedData.selectedWebinarId || null)
        localStorage.removeItem("preRegistrationData")

        // Verificar si el usuario ya está registrado en el evento/webinar seleccionado
        if (parsedData.activeTab === "events" && parsedData.selectedEventId) {
          checkEventRegistration(parsedData.selectedEventId)
        } else if (parsedData.activeTab === "webinars" && parsedData.selectedWebinarId) {
          checkWebinarRegistration(parsedData.selectedWebinarId)
        }
      } else {
        // Si no hay datos de pre-registro, intentar recuperar la selección simple
        const selectionData = localStorage.getItem("ticketSelectionData")
        if (selectionData) {
          const parsedSelection = JSON.parse(selectionData)
          setActiveTab(parsedSelection.activeTab || "events")

          if (parsedSelection.activeTab === "events" && parsedSelection.selectedEventId) {
            setSelectedEventId(parsedSelection.selectedEventId)
            setSelectedEvents({ [parsedSelection.selectedEventId]: true })
            checkEventRegistration(parsedSelection.selectedEventId)
            fetchTicketTypes(parsedSelection.selectedEventId)
          } else if (parsedSelection.activeTab === "webinars" && parsedSelection.selectedWebinarId) {
            setSelectedWebinarId(parsedSelection.selectedWebinarId)
            checkWebinarRegistration(parsedSelection.selectedWebinarId)
            fetchTicketTypes(parsedSelection.selectedWebinarId)
          }

          localStorage.removeItem("ticketSelectionData")
        }
      }
    }
  }

  // Cambiar de pestaña
  const handleTabChange = (tab: "events" | "webinars") => {
    setActiveTab(tab)
    setSelectedTicket(null)
    setTotalPrice(0)
  }

  // Verificar si hay datos guardados al cargar la página
  useEffect(() => {
    // Solo recuperar datos si el usuario está autenticado
    if (isAuthenticated) {
      const selectionData = localStorage.getItem("ticketSelectionData")
      if (selectionData) {
        try {
          const parsedSelection = JSON.parse(selectionData)
          setActiveTab(parsedSelection.activeTab || "events")

          if (parsedSelection.activeTab === "events" && parsedSelection.selectedEventId) {
            setSelectedEventId(parsedSelection.selectedEventId)
            setSelectedEvents({ [parsedSelection.selectedEventId]: true })
            checkEventRegistration(parsedSelection.selectedEventId)
            fetchTicketTypes(parsedSelection.selectedEventId)
          } else if (parsedSelection.activeTab === "webinars" && parsedSelection.selectedWebinarId) {
            setSelectedWebinarId(parsedSelection.selectedWebinarId)
            checkWebinarRegistration(parsedSelection.selectedWebinarId)
            fetchTicketTypes(parsedSelection.selectedWebinarId)
          }

          localStorage.removeItem("ticketSelectionData")
        } catch (error) {
          console.error("Error al recuperar datos de selección:", error)
        }
      }
    }
  }, [isAuthenticated, fetchTicketTypes])

  // No renderizar nada hasta que las traducciones estén cargadas
  if (!isLoaded) return null

  const handleReserveWebinar = async () => {
    try {
      setIsSubmitting(true)

      // Verificar si el usuario ya está registrado en este webinar
      if (isWebinarRegistered) {
        setModalState({
          title: "Ya estás registrado",
          message: `Ya tienes una suscripción activa para este webinar. Puedes ver tus tickets en tu panel de usuario.`,
          isOpen: true
        })
        return // Salir de la función si ya está registrado
      }

      if (!selectedWebinarId) {
        throw new Error("No se ha seleccionado un webinar válido")
      }

      const selectedWebinar = webinars.find((w) => w._id === selectedWebinarId)
      if (!selectedWebinar) {
        throw new Error("Webinar no encontrado")
      }

      // Usar exactamente la misma lógica que en la página de webinars
      const result = await createTicketWithCurrentUser(
        selectedWebinarId,
        selectedWebinar.title,
        selectedWebinar.description,
        "webinar", // Especificar que es un webinar
      )

      // Actualizar el estado para reflejar que el usuario ahora está registrado
      setIsWebinarRegistered(true)

      // Mostrar modal de éxito
      setModalState({
        title: "¡Registro exitoso!",
        message: `Te has registrado al webinar ${selectedWebinar.title}. Te redirigiremos a tu panel de usuario.`,
        isOpen: true
      })
    } catch (error) {
      console.error("Error al registrarse al webinar:", error)

      // Mostrar mensaje de error más amigable
      setModalState({
        title: "Error en el registro",
        message:
          error instanceof Error
            ? error.message
            : "Hubo un error al realizar el registro. Por favor, inténtalo de nuevo.",
        isOpen: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setModalState({
      title: "",
      message: "",
      isOpen: false
    })
  }

  const updateModal = (title: string, message: string, isOpen: boolean = true) => {
    setModalState({
      title,
      message,
      isOpen
    })
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      {/* Sección de título y pestañas */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl uppercase mb-4">Reserva de Tickets</h1>
            <p className="text-xl text-gray-light max-w-3xl mx-auto font-cormorant">
              Asegura tu lugar en nuestros exclusivos eventos de arquitectura
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-dark-gray inline-flex rounded-md p-1">
              <button
                onClick={() => handleTabChange("events")}
                className={`px-6 py-2 rounded-md transition-colors ${
                  activeTab === "events" ? "bg-burgundy text-white" : "text-white hover:bg-burgundy/20"
                }`}
              >
                Selecciona tu evento
              </button>
              <button
                onClick={() => handleTabChange("webinars")}
                className={`px-6 py-2 rounded-md transition-colors ${
                  activeTab === "webinars" ? "bg-burgundy text-white" : "text-white hover:bg-burgundy/20"
                }`}
              >
                Selecciona tu webinar
              </button>
            </div>
          </div>

          {/* Contenido según la pestaña activa */}
          {activeTab === "events" ? (
            /* Contenido de eventos */
            <div className="bg-dark-gray p-8 rounded-sm mb-12">
              <h2 className="text-2xl font-bold mb-6">Selecciona un evento</h2>

              {isLoadingEvents ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                  <p className="mt-4">Cargando eventos...</p>
                </div>
              ) : events.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-4 justify-center mb-8">
                    {/* Eventos dinámicos de la API */}
                    {events.map((event) => (
                      <button
                        key={event._id}
                        onClick={() => handleSelectMainEvent(event._id)}
                        className={`px-6 py-2 transition-colors ${
                          selectedEventId === event._id
                            ? "bg-burgundy text-white"
                            : "bg-rich-black text-white hover:bg-burgundy/20"
                        }`}
                      >
                        {event.title}
                      </button>
                    ))}
                  </div>

                  {/* Detalles del evento seleccionado */}
                  {selectedEventId && (
                    <>
                      {/* Mostrar mensaje si el usuario ya está registrado */}
                      {isAuthenticated && isEventRegistered && (
                        <div className="bg-green-900/20 border border-green-500 p-4 rounded-md mb-6 flex items-start">
                          <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                          <p>
                            Ya estás registrado en este evento. Puedes ver tus tickets en tu{" "}
                            <a href="/users/dashboard" className="text-gold hover:underline">
                              panel de usuario
                            </a>
                            .
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <div className="flex items-start mb-4">
                            <Calendar className="h-5 w-5 mr-3 text-gold mt-1" />
                            <div>
                              <p className="font-medium">{t("common.date")}</p>
                              <p className="text-gray-light">
                                {events.find((e) => e._id === selectedEventId)?.date &&
                                  formatEventDate(events.find((e) => e._id === selectedEventId)?.date || "")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start mb-4">
                            <MapPin className="h-5 w-5 mr-3 text-gold mt-1" />
                            <div>
                              <p className="font-medium">{t("common.location")}</p>
                              <p className="text-gray-light">
                                {events.find((e) => e._id === selectedEventId)?.location}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-start mb-4">
                            <Clock className="h-5 w-5 mr-3 text-gold mt-1" />
                            <div>
                              <p className="font-medium">{t("common.schedule")}</p>
                              <p className="text-gray-light">
                                {formatEventDate(events.find((e) => e._id === selectedEventId)?.date || "")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <Users className="h-5 w-5 mr-3 text-gold mt-1" />
                            <div>
                              <p className="font-medium">{t("common.capacity")}</p>
                              <p className="text-gray-light">{t("preview.mainEvent.capacity")}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Descripción del evento */}
                      <div className="mt-6">
                        <h3 className="text-xl font-bold mb-2">Descripción</h3>
                        <p className="text-gray-light">{events.find((e) => e._id === selectedEventId)?.description}</p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p>No hay eventos disponibles en este momento.</p>
                </div>
              )}
            </div>
          ) : (
            /* Contenido de webinars */
            <div className="bg-dark-gray p-8 rounded-sm mb-12">
              <h2 className="text-2xl font-bold mb-6">Selecciona un webinar</h2>

              {isLoadingWebinars ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                  <p className="mt-4">Cargando webinars...</p>
                </div>
              ) : webinars.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-4 justify-center mb-8">
                    {/* Webinars dinámicos de la API */}
                    {webinars.map((webinar) => (
                      <button
                        key={webinar._id}
                        onClick={() => handleSelectWebinar(webinar._id)}
                        className={`px-6 py-2 transition-colors ${
                          selectedWebinarId === webinar._id
                            ? "bg-burgundy text-white"
                            : "bg-rich-black text-white hover:bg-burgundy/20"
                        }`}
                      >
                        {webinar.title}
                      </button>
                    ))}
                  </div>

                  {/* Detalles del webinar seleccionado */}
                  {selectedWebinarId && (
                    <>
                      {/* Mostrar mensaje si el usuario ya está registrado */}
                      {isAuthenticated && isWebinarRegistered && (
                        <div className="bg-green-900/20 border border-green-500 p-4 rounded-md mb-6 flex items-start">
                          <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                          <p>
                            Ya estás registrado en este webinar. Puedes ver tus tickets en tu{" "}
                            <a href="/users/dashboard" className="text-gold hover:underline">
                              panel de usuario
                            </a>
                            .
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <div className="flex items-start mb-4">
                            <Calendar className="h-5 w-5 mr-3 text-gold mt-1" />
                            <div>
                              <p className="font-medium">{t("common.date")}</p>
                              <p className="text-gray-light">
                                {formatWebinarDate(webinars.find((w) => w._id === selectedWebinarId)?.date || "")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start mb-4">
                            <MapPin className="h-5 w-5 mr-3 text-gold mt-1" />
                            <div>
                              <p className="font-medium">{t("preview.platform")}</p>
                              <p className="text-gray-light">{t("preview.onlineEvent")}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-start mb-4">
                            <Clock className="h-5 w-5 mr-3 text-gold mt-1" />
                            <div>
                              <p className="font-medium">{t("common.schedule")}</p>
                              <p className="text-gray-light">
                                {formatWebinarDate(webinars.find((w) => w._id === selectedWebinarId)?.date || "")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Descripción del webinar */}
                      <div className="mt-6">
                        <h3 className="text-xl font-bold mb-2">Descripción</h3>
                        <p className="text-gray-light">
                          {webinars.find((w) => w._id === selectedWebinarId)?.description}
                        </p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p>No hay webinars disponibles en este momento.</p>
                </div>
              )}
            </div>
          )}

          {/* Ticket Options - Solo mostrar cuando se ha seleccionado un evento o webinar */}
          {((activeTab === "events" && selectedEventId) || (activeTab === "webinars" && selectedWebinarId)) && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-center">Selecciona tu Ticket</h2>

              {isLoadingTicketTypes ? (
                <div className="text-center py-8">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                  <p className="mt-4">Cargando opciones disponibles...</p>
                </div>
              ) : ticketTypes.length === 0 ? (
                <div className="text-center py-8 bg-muted rounded-lg">
                  <p className="text-lg text-muted-foreground mb-2">
                    {t("tickets.noTicketsAvailable")}
                  </p>
                  {user?.role === UserRole.ADMIN && (
                    <p className="text-sm text-muted-foreground">
                      Como administrador, puedes crear tipos de tickets en el panel de administración.
                    </p>
                  )}
                </div>
              ) : !isAuthenticated ? (
                // Ticket único para usuarios no autenticados
                <div className="max-w-md mx-auto">
                  <div className="bg-dark-gray p-8 border border-gold/30 hover:border-gold transition-colors rounded-sm shadow-lg">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-burgundy/20 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gold" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-center mb-2">Reserva tu ticket ahora</h3>
                    <p className="text-gray-light text-center mb-6">
                      Regístrate para poder acceder o inicia tu sesión para ver las opciones disponibles
                    </p>
                    <button
                      onClick={handleOpenLoginModal}
                      className="w-full bg-burgundy hover:bg-burgundy/90 text-white py-3 font-medium transition-colors"
                    >
                      Registrarse
                    </button>
                  </div>
                </div>
              ) : activeTab === "events" ? (
                // LÓGICA PARA EVENTOS
                user?.role === "exhibitor" ? (
                  // Opción especial para exhibidores (solo para eventos)
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-dark-gray p-8 border border-gold/30 hover:border-gold transition-colors rounded-sm shadow-lg">
                      <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-burgundy/20 flex items-center justify-center">
                          <Users className="h-8 w-8 text-gold" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-center mb-4">Obtén tu stand para este evento</h3>
                      <p className="text-gray-light text-center mb-6">
                        Te haremos un primer contacto vía telefónica o email (como prefieras) y te indicaremos los pasos
                        a seguir junto con las diferentes opciones y costos para que puedas configurar tu stand a tu
                        gusto.
                      </p>

                      {isEventRegistered && (
                        <div className="bg-green-900/20 border border-green-500 p-4 rounded-md mb-4 flex items-start">
                          <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                          <p>
                            Ya has solicitado un stand para este evento. Puedes modificar tus datos de contacto si lo
                            necesitas.
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (selectedEventId) {
                            handleExhibitorStandRequest(
                              selectedEventId,
                              events.find((e) => e._id === selectedEventId)?.title || "Evento seleccionado"
                            )
                          }
                        }}
                        className="w-full bg-burgundy hover:bg-burgundy/90 text-white py-3 font-medium transition-colors"
                        disabled={isSubmitting || !selectedEventId}
                      >
                        {isSubmitting
                          ? "Procesando..."
                          : isEventRegistered
                            ? "Modificar datos de contacto"
                            : "Obtén tu stand"}
                      </button>
                    </div>
                  </div>
                ) : isEventRegistered ? (
                  // Mensaje para usuarios ya registrados en eventos
                  <div className="bg-green-900/20 border border-green-500 p-6 rounded-md mb-6 flex items-start max-w-2xl mx-auto">
                    <Check className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0 text-green-500" />
                    <div>
                      <p className="font-medium mb-2">Ya estás registrado en este evento.</p>
                      <p>
                        Puedes ver tus tickets en tu{" "}
                        <a href="/users/dashboard" className="text-gold hover:underline">
                          panel de usuario
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                ) : ticketTypes.length > 0 ? (
                  // Mostrar tickets disponibles para usuarios autenticados normales (eventos)
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {ticketTypes.map((ticket) => (
                      <div
                        key={ticket._id}
                        className={`bg-dark-gray p-6 border ${
                          selectedTicket === ticket._id ? "border-gold" : "border-transparent"
                        } hover:border-gold/50 transition-colors`}
                      >
                        <h3 className="text-xl font-bold mb-2">{ticket.name}</h3>
                        <p className="text-2xl text-gold mb-4">€{ticket.price}</p>
                        <ul className="mb-6 space-y-2">
                          {ticket.features && Array.isArray(ticket.features) ? (
                            ticket.features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <Check className="h-5 w-5 mr-2 text-gold flex-shrink-0" />
                                <span className="text-gray-light">{feature}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-gray-light">No hay características disponibles</li>
                          )}
                        </ul>
                        <button
                          onClick={() => handleSelectTicket(ticket._id)}
                          disabled={isSubmitting || isCheckingRegistration}
                          className="w-full bg-burgundy hover:bg-burgundy/90 text-white py-2 transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? "Procesando..." : "Obtener Ticket"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p>No hay tipos de tickets disponibles para este evento.</p>
                  </div>
                )
              ) : // LÓGICA PARA WEBINARS
              isWebinarRegistered ? (
                // Mensaje para usuarios ya registrados en webinars
                <div className="bg-green-900/20 border border-green-500 p-6 rounded-md mb-6 flex items-start max-w-2xl mx-auto">
                  <Check className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0 text-green-500" />
                  <div>
                    <p className="font-medium mb-2">Ya estás registrado en este webinar.</p>
                    <p>
                      Puedes ver tus tickets en tu{" "}
                      <a href="/users/dashboard" className="text-gold hover:underline">
                        panel de usuario
                      </a>
                      .
                    </p>
                  </div>
                </div>
              ) : (
                // Opción simple para registrarse en webinars
                <div className="max-w-md mx-auto">
                  <div className="bg-dark-gray p-8 border border-gold/30 hover:border-gold transition-colors rounded-sm shadow-lg">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-burgundy/20 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gold" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-center mb-2">
                      Webinar: {webinars.find((w) => w._id === selectedWebinarId)?.title}
                    </h3>
                    <p className="text-gray-light text-center mb-6">
                      Fecha: {formatWebinarDate(webinars.find((w) => w._id === selectedWebinarId)?.date || "")}
                    </p>
                    <button
                      onClick={() => handleReserveWebinar()}
                      disabled={isSubmitting}
                      className="w-full bg-burgundy hover:bg-burgundy/90 text-white py-3 font-medium transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? "Procesando..." : "Registrarse al webinar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selección de eventos adicionales - Solo se muestra si hay un ticket seleccionado y el usuario está autenticado y NO está registrado */}
          {selectedTicket && isAuthenticated && activeTab === "events" && selectedEventId && !isEventRegistered && (
            <div className="bg-dark-gray p-8 rounded-sm mb-12">
              <h2 className="text-2xl font-bold mb-6">Selecciona eventos adicionales</h2>

              <div className="space-y-4 mb-8">
                {/* Evento principal siempre incluido */}
                <div className="flex items-center justify-between p-4 border border-gray-700 rounded-sm">
                  <div className="flex items-center">
                    <input type="checkbox" id="event-main" checked={true} disabled={true} className="mr-3 h-5 w-5" />
                    <label htmlFor="event-main" className="cursor-pointer">
                      <div className="font-medium">{events.find((e) => e._id === selectedEventId)?.title}</div>
                      <div className="text-sm text-gray-light">Incluido en el precio base</div>
                    </label>
                  </div>
                  <div className="text-gold">Incluido</div>
                </div>

                {/* Eventos adicionales - mostrar todos los eventos excepto el principal */}
                {events
                  .filter((event) => event._id !== selectedEventId)
                  .map((event) => (
                    <div
                      key={event._id}
                      className="flex items-center justify-between p-4 border border-gray-700 rounded-sm"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`event-${event._id}`}
                          checked={selectedEvents[event._id] || false}
                          onChange={() => handleEventSelection(event._id)}
                          className="mr-3 h-5 w-5"
                        />
                        <label htmlFor={`event-${event._id}`} className="cursor-pointer">
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-gray-light">{formatEventDate(event.date)}</div>
                        </label>
                      </div>
                      <div className="text-gold">+€50</div>
                    </div>
                  ))}
              </div>

              {/* Resumen de precio */}
              <div className="bg-rich-black p-6 rounded-sm mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Ticket {ticketTypes.find((t) => t._id === selectedTicket)?.name}</span>
                  <span>€{ticketTypes.find((t) => t._id === selectedTicket)?.price}</span>
                </div>

                {/* Eventos adicionales seleccionados */}
                {events
                  .filter((event) => event._id !== selectedEventId && selectedEvents[event._id])
                  .map((event) => (
                    <div key={event._id} className="flex justify-between items-center mb-4">
                      <span>{event.title}</span>
                      <span>+€50</span>
                    </div>
                  ))}

                <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="text-xl text-gold font-bold">€{totalPrice}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleReserveTicket}
                  disabled={isSubmitting}
                  className="bg-burgundy hover:bg-burgundy/90 text-white px-8 py-3 text-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Procesando..." : "Confirmar reserva"}
                </button>
              </div>
            </div>
          )}

          {/* Botón de confirmación para webinars - Solo se muestra si hay un ticket seleccionado, el usuario está autenticado y NO está registrado */}
          {selectedTicket &&
            isAuthenticated &&
            activeTab === "webinars" &&
            selectedWebinarId &&
            !isWebinarRegistered && (
              <div className="bg-dark-gray p-8 rounded-sm mb-12">
                <h2 className="text-2xl font-bold mb-6">Resumen de tu reserva</h2>

                <div className="bg-rich-black p-6 rounded-sm mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Webinar</span>
                    <span>{webinars.find((w) => w._id === selectedWebinarId)?.title}</span>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Fecha</span>
                    <span>{formatWebinarDate(webinars.find((w) => w._id === selectedWebinarId)?.date || "")}</span>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">
                      Ticket {ticketTypes.find((t) => t._id === selectedTicket)?.name}
                    </span>
                    <span>€{ticketTypes.find((t) => t._id === selectedTicket)?.price}</span>
                  </div>

                  <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <span className="text-xl text-gold font-bold">
                      €{ticketTypes.find((t) => t._id === selectedTicket)?.price}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleReserveTicket}
                    disabled={isSubmitting}
                    className="bg-burgundy hover:bg-burgundy/90 text-white px-8 py-3 text-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Procesando..." : "Confirmar reserva"}
                  </button>
                </div>
              </div>
            )}

          {/* Pre-Registration Form */}
          {showPreRegister && (
            <div className="bg-dark-gray p-8 rounded-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{t("tickets.preRegister")}</h2>
                <button onClick={() => setShowPreRegister(false)} className="text-gray-light hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handlePreRegister}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="firstName" className="block mb-2 text-sm font-medium">
                      {t("common.firstName")}
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full bg-rich-black border border-gray-light p-2 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block mb-2 text-sm font-medium">
                      {t("common.lastName")}
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full bg-rich-black border border-gray-light p-2 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block mb-2 text-sm font-medium">
                      {t("common.email")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-rich-black border border-gray-light p-2 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block mb-2 text-sm font-medium">
                      {t("common.company")}
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full bg-rich-black border border-gray-light p-2 text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="position" className="block mb-2 text-sm font-medium">
                      {t("common.position")}
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full bg-rich-black border border-gray-light p-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Procesando..." : "Continuar"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Additional Information */}
          <div className="bg-dark-gray p-8 rounded-sm">
            <h2 className="text-2xl font-bold mb-6">Información Adicional</h2>
            <div className="space-y-4 text-gray-light">
              <p>Los tickets están sujetos a disponibilidad y pueden agotarse rápidamente para eventos destacados.</p>
              <p>
                Una vez realizada la compra, recibirás un correo electrónico con tu confirmación y detalles para acceder
                al evento.
              </p>
              <p>
                Si necesitas cancelar tu reserva, puedes hacerlo hasta 7 días antes del evento para recibir un reembolso
                completo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginModalClose}
        redirectPath="/tickets"
        prefilledEmail={formData.email}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        title={modalState.title}
        message={modalState.message}
        redirectPath="/users/dashboard"
        redirectDelay={3000}
        isError={modalState.title.toLowerCase().includes("error")}
      />

      {/* Modal de contacto para exhibidores */}
      <ExhibitorContactModal
        isOpen={isExhibitorContactModalOpen}
        onClose={() => setIsExhibitorContactModalOpen(false)}
        onSuccess={handleExhibitorContactSuccess}
        eventId={exhibitorEventData.id}
        eventName={exhibitorEventData.name}
      />
    </main>
  )
}
