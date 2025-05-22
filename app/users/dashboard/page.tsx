"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  User,
  Mail,
  AtSign,
  Briefcase,
  MapPin,
  Calendar,
  Edit,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  TicketIcon,
  Star,
  AlertCircle,
  CalendarIcon,
  Video,
  RefreshCw,
  Building,
} from "lucide-react"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { getUserTickets, cancelTicket, getTicketDetails } from "@/services/ticket-service"
import { getUserById, updateUser, type UpdateUserDto } from "@/services/user-service"
import type { Ticket } from "@/services/ticket-service"
import { countries } from "@/utils/countries"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ExhibitorTab from "./exhibitor-tab"
import { UserRole } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface FormData {
  username: string
  email: string
  firstName: string
  lastName: string
  cargo: string
  empresa: string
  paisResidencia: string
  provider: string
  isActive: boolean
  isProfileCompleted: boolean
  googleId: string
  picture: string
  role: UserRole
}

export default function UserDashboardPage() {
  const { t, isLoaded } = useLanguage()
  const { isAuthenticated, user: authUser, updateUser: updateAuthUser } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")

  // Estados para tickets
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketDetails, setTicketDetails] = useState<{ [key: string]: any }>({})
  const [expandedTickets, setExpandedTickets] = useState<{ [key: string]: boolean }>({})
  const [isLoadingDetails, setIsLoadingDetails] = useState<{ [key: string]: boolean }>({})
  const [ticketToCancel, setTicketToCancel] = useState<Ticket | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Estados para el perfil de usuario
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [isRefreshingUser, setIsRefreshingUser] = useState(false)

  // Estado para el formulario de edición
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    cargo: "",
    empresa: "",
    paisResidencia: "",
    provider: "",
    isActive: true,
    isProfileCompleted: false,
    googleId: "",
    picture: "",
    role: UserRole.VISITOR
  })

  // Redirigir si no está autenticado
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.push("/")
    }
  }, [isLoaded, isAuthenticated, router])

  // Check if user is an exhibitor
  const isExhibitor = authUser?.role === UserRole.EXHIBITOR

  // Cargar datos del usuario directamente desde la API
  const fetchUserData = async () => {
    if (!authUser?.id) return

    try {
      setIsRefreshingUser(true)
      console.log("Obteniendo datos del usuario desde la API...")
      const userData = await getUserById(authUser.id)
      console.log("Datos del usuario obtenidos:", userData)

      // Asegurarnos de que el rol sea del tipo correcto
      let validatedRole: UserRole;
      if (typeof userData.role === 'string') {
        switch(userData.role.toLowerCase()) {
          case 'admin':
            validatedRole = UserRole.ADMIN;
            break;
          case 'visitor':
            validatedRole = UserRole.VISITOR;
            break;
          case 'exhibitor':
            validatedRole = UserRole.EXHIBITOR;
            break;
          default:
            validatedRole = UserRole.VISITOR;
        }
      } else {
        validatedRole = userData.role || UserRole.VISITOR;
      }

      // Crear objeto de usuario validado
      const validatedUserData = {
        ...userData,
        role: validatedRole,
        isProfileCompleted: true
      };

      // Actualizar el estado local con los datos completos del usuario
      setUser(validatedUserData)

      // Actualizar también el contexto de autenticación
      updateAuthUser(validatedUserData)

      // Inicializar formData con los datos validados
      setFormData({
        username: validatedUserData.username || "",
        email: validatedUserData.email || "",
        firstName: validatedUserData.firstName || "",
        lastName: validatedUserData.lastName || "",
        cargo: validatedUserData.cargo || "",
        empresa: validatedUserData.empresa || "",
        paisResidencia: validatedUserData.paisResidencia || "",
        provider: validatedUserData.provider || "local",
        isActive: validatedUserData.isActive !== false,
        isProfileCompleted: true,
        googleId: validatedUserData.googleId || "",
        picture: validatedUserData.picture || "",
        role: validatedRole
      })

      // Detectar campos faltantes
      const missing: string[] = []
      if (!validatedUserData.firstName) missing.push("Nombre")
      if (!validatedUserData.lastName) missing.push("Apellido")
      if (!validatedUserData.cargo) missing.push("Cargo")
      if (!validatedUserData.empresa) missing.push("Empresa")
      if (!validatedUserData.paisResidencia) missing.push("País de residencia")
      if (!validatedUserData.email) missing.push("Email")

      setMissingFields(missing)
      setIsLoading(false)
    } catch (err: any) {
      console.error("Error al obtener datos del usuario:", err)
      setError(`Error al cargar datos del usuario: ${err.message}`)

      // Si falla la carga desde la API, usar los datos del contexto como respaldo
      if (authUser) {
        // Asegurarnos de que el rol del authUser también sea válido
        let backupRole: UserRole = UserRole.VISITOR;
        if (authUser.role) {
          if (typeof authUser.role === 'string') {
            switch(authUser.role.toLowerCase()) {
              case 'admin':
                backupRole = UserRole.ADMIN;
                break;
              case 'visitor':
                backupRole = UserRole.VISITOR;
                break;
              case 'exhibitor':
                backupRole = UserRole.EXHIBITOR;
                break;
            }
          } else {
            backupRole = authUser.role;
          }
        }

        const backupUserData = {
          ...authUser,
          role: backupRole
        };

        setUser(backupUserData)
        setFormData({
          username: backupUserData.username || "",
          email: backupUserData.email || "",
          firstName: backupUserData.firstName || "",
          lastName: backupUserData.lastName || "",
          cargo: backupUserData.cargo || "",
          empresa: backupUserData.empresa || "",
          paisResidencia: backupUserData.paisResidencia || "",
          provider: backupUserData.provider || "local",
          isActive: backupUserData.isActive !== false,
          isProfileCompleted: backupUserData.isProfileCompleted || false,
          googleId: backupUserData.googleId || "",
          picture: backupUserData.picture || "",
          role: backupRole
        })
      }
    } finally {
      setIsRefreshingUser(false)
      setIsLoading(false)
    }
  }

  // Inicializar datos del usuario
  useEffect(() => {
    if (authUser?.id) {
      fetchUserData()
    }
  }, [authUser?.id])

  // Cargar tickets del usuario
  useEffect(() => {
    const fetchTickets = async () => {
      if (!isAuthenticated || !authUser) return

      try {
        setIsLoading(true)
        console.log("Cargando tickets para el usuario:", authUser.id)

        const token = localStorage.getItem("token")
        if (!token) {
          setError("No se encontró tu sesión. Por favor, inicia sesión nuevamente.")
          setIsLoading(false)
          return
        }

        const userTickets = await getUserTickets()
        console.log("Tickets cargados:", userTickets)
        setTickets(userTickets)
      } catch (err: any) {
        console.error("Error al cargar tickets:", err)

        if (err.message === "Usuario no autenticado") {
          setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.")
        } else if (err.message === "No tienes tickets reservados") {
          setTickets([])
        } else {
          setError(err.message || "Error al cargar tus tickets")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated && authUser) {
      fetchTickets()
    }
  }, [isAuthenticated, authUser])

  // Función para cargar detalles de un ticket
  const loadTicketDetails = async (ticketId: string) => {
    if (ticketDetails[ticketId]) return // Ya tenemos los detalles

    try {
      setIsLoadingDetails((prev) => ({ ...prev, [ticketId]: true }))
      const details = await getTicketDetails(ticketId)
      console.log(`Detalles del ticket ${ticketId}:`, details)
      setTicketDetails((prev) => ({ ...prev, [ticketId]: details }))
    } catch (err: any) {
      console.error(`Error al cargar detalles del ticket ${ticketId}:`, err)
    } finally {
      setIsLoadingDetails((prev) => ({ ...prev, [ticketId]: false }))
    }
  }

  // Función para expandir/colapsar un ticket
  const toggleTicketExpansion = (ticketId: string) => {
    setExpandedTickets((prev) => {
      const newState = { ...prev, [ticketId]: !prev[ticketId] }
      if (newState[ticketId]) {
        loadTicketDetails(ticketId)
      }
      return newState
    })
  }

  // Función para cancelar un ticket
  const handleCancelTicket = async (ticketId: string) => {
    try {
      setIsCancelling(true)
      await cancelTicket(ticketId)
      setTickets((prevTickets) =>
        prevTickets.map((ticket) => (ticket._id === ticketId ? { ...ticket, status: "cancelled" } : ticket)),
      )
      setSuccessMessage("Ticket cancelado con éxito")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error al cancelar ticket:", err)
      setError(err.message || "Error al cancelar el ticket")
    } finally {
      setIsCancelling(false)
    }
  }

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Manejar específicamente el campo role
    if (name === 'role') {
      let roleValue: UserRole;
      // Convertir el valor del select al enum UserRole
      switch(value.toLowerCase()) {
        case 'admin':
          roleValue = UserRole.ADMIN;
          break;
        case 'visitor':
          roleValue = UserRole.VISITOR;
          break;
        case 'exhibitor':
          roleValue = UserRole.EXHIBITOR;
          break;
        default:
          roleValue = UserRole.VISITOR; // Valor por defecto
      }
      console.log('Nuevo valor de role:', roleValue);
      setFormData(prev => ({
        ...prev,
        role: roleValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }

  // Guardar cambios del perfil
  const handleSaveProfile = async () => {
    if (!user?.id && !authUser?.id) return
    const userId = user?.id || authUser?.id

    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      // Preparar datos para actualizar
      const updateData: UpdateUserDto = {
        username: formData.username,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        cargo: formData.cargo,
        empresa: formData.empresa,
        paisResidencia: formData.paisResidencia,
        isActive: formData.isActive,
        role: formData.role
      }

      console.log("Enviando actualización de perfil:", updateData)

      // Actualizar el perfil del usuario usando el servicio
      const updatedUser = await updateUser(userId, updateData)
      console.log("Perfil actualizado:", updatedUser)

      // Actualizar el estado local
      setUser(updatedUser)

      // Actualizar el contexto de autenticación
      updateAuthUser({
        ...updatedUser,
        isProfileCompleted: true,
      })

      setSuccessMessage("Perfil actualizado con éxito")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error al actualizar perfil:", err)
      setError(err.message || "Error al actualizar el perfil")
    } finally {
      setIsSaving(false)
    }
  }

  // Formatear fecha
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "No especificado"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "Fecha inválida"
    }
  }

  if (!isLoaded) return null

  // Modificar la sección de visualización de tickets para mostrar los nuevos campos
  const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    const [showDetails, setShowDetails] = useState(false)
    const isEvent = ticket.type === "event"

    return (
      <div className="bg-dark-gray p-4 rounded-lg border border-gray-700 mb-4 hover:border-gold/30 transition-all">
        <div className="flex flex-col sm:flex-row justify-between">
          <div className="mb-4 sm:mb-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isEvent ? "bg-burgundy/20" : "bg-blue-900/20"
                }`}
              >
                {isEvent ? (
                  <CalendarIcon className="h-5 w-5 text-burgundy" />
                ) : (
                  <Video className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">{ticket.eventTitle}</h3>
                <div className="flex items-center text-gray-light text-sm">
                  {ticket.eventDate && (
                    <span className="flex items-center mr-3">
                      <Calendar className="h-4 w-4 mr-1 text-gold" />
                      {new Date(ticket.eventDate).toLocaleDateString()}
                    </span>
                  )}
                  {ticket.eventLocation && (
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gold" />
                      {ticket.eventLocation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  ticket.status === "reserved"
                    ? "bg-green-900/20 text-green-500 border border-green-500/30"
                    : "bg-red-900/20 text-red-500 border border-red-500/30"
                }`}
              >
                {ticket.status === "reserved" ? "Reservado" : "Cancelado"}
              </span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  isEvent
                    ? "bg-burgundy/10 text-burgundy border border-burgundy/30"
                    : "bg-blue-900/10 text-blue-400 border border-blue-500/30"
                }`}
              >
                {isEvent ? "Evento" : "Webinar"}
              </span>
              {ticket.isFeatured && (
                <span className="px-2 py-1 text-xs rounded-full bg-gold/10 text-gold border border-gold/30">
                  <Star className="h-3 w-3 inline mr-1" />
                  Destacado
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-start">
            {ticket.webinarLink && ticket.status === "reserved" && (
              <a
                href={ticket.webinarLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-900/20 text-blue-400 rounded-md transition-colors text-sm hover:bg-blue-900/30"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Acceder al Webinar</span>
              </a>
            )}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-gray-600 hover:bg-gray-800 text-gray-300 rounded-md transition-colors text-sm"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>Menos detalles</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>Más detalles</span>
                </>
              )}
            </button>
            {ticket.status === "reserved" && (
              <button
                onClick={() => handleCancelTicket(ticket._id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500 rounded-md transition-colors text-sm"
              >
                <X className="h-4 w-4" />
                <span>Cancelar</span>
              </button>
            )}
          </div>
        </div>

        {/* Detalles expandibles */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            {ticket.eventImage && (
              <div className="mb-4">
                <img
                  src={ticket.eventImage || "/placeholder.svg"}
                  alt={`Imagen del evento: ${ticket.eventTitle}`}
                  className="w-full h-40 object-cover rounded-md"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-light mb-1">Descripción</h4>
                <p className="text-white">{ticket.eventDescription}</p>
              </div>

              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-light mb-1">ID del Ticket</h4>
                  <p className="text-white font-mono text-sm">{ticket._id}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-light mb-1">Fecha de Reserva</h4>
                  <p className="text-white">{new Date(ticket.createdAt).toLocaleString()}</p>
                </div>

                {ticket.webinarLink && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-light mb-1">Enlace del Webinar</h4>
                    <a
                      href={ticket.webinarLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center bg-blue-900/10 px-3 py-1 rounded-md inline-block"
                    >
                      <span className="truncate max-w-[200px] inline-block align-middle">{ticket.webinarLink}</span>
                      <ExternalLink className="h-3 w-3 ml-1 inline" />
                    </a>
                  </div>
                )}

                {ticket.eventLocation && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-light mb-1">Ubicación</h4>
                    <p className="text-white">{ticket.eventLocation}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-rich-black p-3 rounded-md text-sm">
              <h4 className="text-sm font-medium text-gray-light mb-2">Información Técnica</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div>
                  <span className="text-gray-light">ID de Usuario:</span>
                  <span className="ml-1 font-mono text-xs">{ticket.userId}</span>
                </div>
                <div>
                  <span className="text-gray-light">ID de {isEvent ? "Evento" : "Webinar"}:</span>
                  <span className="ml-1 font-mono text-xs">{isEvent ? ticket.eventId : ticket.webinarId}</span>
                </div>
                <div>
                  <span className="text-gray-light">Última Actualización:</span>
                  <span className="ml-1">{new Date(ticket.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Determinar qué datos de usuario usar (priorizar los datos cargados directamente de la API)
  const displayUser = user || authUser
  const userEmail = displayUser?.email || "No disponible"

  if (!isAuthenticated || !authUser) {
    return null
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gold">Panel de Usuario</h1>

          {/* Mensajes de éxito o error */}
          {error && (
            <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 text-burgundy mr-2 flex-shrink-0" />
              <p className="text-white">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-800/20 border border-green-700 p-4 rounded-md mb-6 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <p className="text-white">{successMessage}</p>
            </div>
          )}

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-dark-gray mb-8 p-1 rounded-md">
              <TabsTrigger
                value="profile"
                className="flex items-center gap-2 data-[state=active]:bg-burgundy data-[state=active]:text-white"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>

              <TabsTrigger
                value="tickets"
                className="flex items-center gap-2 data-[state=active]:bg-burgundy data-[state=active]:text-white"
              >
                <TicketIcon className="h-4 w-4" />
                <span>Tickets</span>
              </TabsTrigger>

              {isExhibitor && (
                <TabsTrigger
                  value="exhibitor"
                  className="flex items-center gap-2 data-[state=active]:bg-burgundy data-[state=active]:text-white"
                >
                  <Building className="h-4 w-4" />
                  <span>Exhibitor</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile">
              {/* Panel de información del usuario */}
              <div className="bg-dark-gray rounded-md overflow-hidden mb-8">
                {/* Cabecera del panel */}
                <div className="bg-gradient-to-r from-burgundy/30 to-dark-gray p-6 flex justify-between items-center border-b border-gray-700">
                  <h2 className="text-xl font-bold flex items-center">
                    <User className="h-5 w-5 mr-2 text-gold" />
                    Información Personal
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={fetchUserData}
                      className="flex items-center text-gray-300 hover:text-white transition-colors"
                      disabled={isRefreshingUser}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshingUser ? "animate-spin" : ""}`} />
                      Actualizar
                    </button>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center text-gold hover:text-gold/80 transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar Perfil
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-gray-light hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {/* Contenido del panel */}
                <div className="p-6">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                      <p className="mt-4">Cargando información del usuario...</p>
                    </div>
                  ) : displayUser ? (
                    isEditing ? (
                      // Formulario de edición
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Información básica */}
                          <div>
                            <label htmlFor="username" className="block text-sm font-medium mb-2 text-gold">
                              Nombre de usuario *
                            </label>
                            <input
                              type="text"
                              id="username"
                              name="username"
                              value={formData.username}
                              onChange={handleChange}
                              className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                              required
                            />
                          </div>

                          <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gold">
                              Email *
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                              required
                              disabled={displayUser.provider === "google"}
                            />
                            {displayUser.provider === "google" && (
                              <p className="text-xs text-gray-light mt-1">
                                El correo electrónico no se puede cambiar para cuentas de Google
                              </p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium mb-2 text-gold">
                              Nombre
                            </label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleChange}
                              className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                            />
                          </div>

                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium mb-2 text-gold">
                              Apellido
                            </label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleChange}
                              className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                            />
                          </div>

                          <div>
                            <label htmlFor="cargo" className="block text-sm font-medium mb-2 text-gold">
                              Cargo
                            </label>
                            <input
                              type="text"
                              id="cargo"
                              name="cargo"
                              value={formData.cargo}
                              onChange={handleChange}
                              className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                            />
                          </div>

                          <div>
                            <label htmlFor="empresa" className="block text-sm font-medium mb-2 text-gold">
                              Empresa
                            </label>
                            <input
                              type="text"
                              id="empresa"
                              name="empresa"
                              value={formData.empresa}
                              onChange={handleChange}
                              className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                            />
                          </div>

                          <div>
                            <label htmlFor="paisResidencia" className="block text-sm font-medium mb-2 text-gold">
                              País de Residencia
                            </label>
                            <select
                              id="paisResidencia"
                              name="paisResidencia"
                              value={formData.paisResidencia}
                              onChange={handleChange}
                              className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                            >
                              <option value="">Selecciona un país</option>
                              {countries.map((country) => (
                                <option key={country.code} value={country.name}>
                                  {country.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="role" className="block text-sm font-medium mb-2 text-gold">
                              Rol
                            </label>
                            <select
                              id="role"
                              name="role"
                              value={formData.role}
                              onChange={handleChange}
                              className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                            >
                              <option value={UserRole.VISITOR}>Visitante</option>
                              <option value={UserRole.EXHIBITOR}>Expositor</option>
                              {formData.role === UserRole.ADMIN && (
                                <option value={UserRole.ADMIN}>Administrador</option>
                              )}
                            </select>
                          </div>
                        </div>

                        <div className="mt-6">
                          <button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-3 rounded-md transition-colors disabled:opacity-50"
                          >
                            {isSaving ? "Guardando..." : "Guardar Cambios"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Vista de información
                      <div>
                        {/* Cabecera con foto y nombre */}
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 pb-6 border-b border-gray-700">
                          {/* Foto de perfil */}
                          <div className="relative">
                            {displayUser.picture ? (
                              <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-burgundy">
                                <Image
                                  src={displayUser.picture || "/placeholder.svg"}
                                  alt={`Foto de perfil de ${displayUser.username || displayUser.firstName || "usuario"}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-28 w-28 rounded-full bg-burgundy/20 flex items-center justify-center border-4 border-burgundy">
                                <User className="h-14 w-14 text-burgundy" />
                              </div>
                            )}

                            {/* Indicador de estado del perfil */}
                            {missingFields.length > 0 ? (
                              <div className="absolute -bottom-2 -right-2 bg-amber-600 text-white p-1 rounded-full">
                                <AlertTriangle className="h-5 w-5" />
                              </div>
                            ) : (
                              <div className="absolute -bottom-2 -right-2 bg-green-600 text-white p-1 rounded-full">
                                <CheckCircle className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          {/* Información principal */}
                          <div className="text-center md:text-left flex-1">
                            <h3 className="text-2xl font-bold">
                              {displayUser.firstName && displayUser.lastName
                                ? `${displayUser.firstName} ${displayUser.lastName}`
                                : displayUser.username}
                            </h3>

                            <div className="flex flex-wrap items-center justify-center md:justify-start mt-2 gap-2">
                              <span className="px-3 py-1 text-sm rounded-full bg-burgundy/20 text-burgundy flex items-center">
                                {displayUser.provider === "google" ? (
                                  <>
                                    <svg
                                      className="w-4 h-4 mr-1"
                                      viewBox="0 0 24 24"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                      />
                                      <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                      />
                                      <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                      />
                                      <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                      />
                                    </svg>
                                    Cuenta de Google
                                  </>
                                ) : (
                                  "Cuenta Local"
                                )}
                              </span>

                              {displayUser.role === UserRole.ADMIN && (
                                <span className="px-3 py-1 text-sm rounded-full bg-gold/20 text-gold flex items-center">
                                  <Shield className="h-4 w-4 mr-1" />
                                  Administrador
                                </span>
                              )}

                              {displayUser.role === UserRole.EXHIBITOR && (
                                <span className="px-3 py-1 text-sm rounded-full bg-blue-900/20 text-blue-400 flex items-center">
                                  <Building className="h-4 w-4 mr-1" />
                                  Expositor
                                </span>
                              )}

                              {missingFields.length > 0 ? (
                                <span className="px-3 py-1 text-sm rounded-full bg-amber-700/20 text-amber-500 flex items-center">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Perfil Incompleto
                                </span>
                              ) : (
                                <span className="px-3 py-1 text-sm rounded-full bg-green-700/20 text-green-500 flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Perfil Completo
                                </span>
                              )}
                            </div>

                            {/* Email destacado */}
                            <div className="mt-3 flex items-center justify-center md:justify-start">
                              <Mail className="h-4 w-4 text-gold mr-2" />
                              <span className="text-gray-300 break-all">{userEmail}</span>
                            </div>
                          </div>
                        </div>

                        {/* Detalles del usuario en grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                          <div className="flex items-start">
                            <AtSign className="h-5 w-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-light text-sm">Nombre de usuario</p>
                              <p className="font-medium">{displayUser.username || "No especificado"}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <Mail className="h-5 w-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-light text-sm">Email</p>
                              <p className="font-medium break-all">{userEmail}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <User className="h-5 w-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-light text-sm">Nombre</p>
                              <p className="font-medium">{displayUser.firstName || "No especificado"}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <User className="h-5 w-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-light text-sm">Apellido</p>
                              <p className="font-medium">{displayUser.lastName || "No especificado"}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <Briefcase className="h-5 w-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-light text-sm">Cargo</p>
                              <p className="font-medium">{displayUser.cargo || "No especificado"}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <Briefcase className="h-5 w-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-light text-sm">Empresa</p>
                              <p className="font-medium">{displayUser.empresa || "No especificado"}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-light text-sm">País de residencia</p>
                              <p className="font-medium">{displayUser.paisResidencia || "No especificado"}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <Shield className="h-5 w-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-light text-sm">Rol</p>
                              <p className="font-medium capitalize">
                                {displayUser.role === UserRole.EXHIBITOR
                                  ? "Expositor"
                                  : displayUser.role === UserRole.ADMIN
                                    ? "Administrador"
                                    : "Visitante"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-light text-sm">Estado</p>
                              <p className="font-medium">
                                {displayUser.isActive ? (
                                  <span className="text-green-500">Activo</span>
                                ) : (
                                  <span className="text-red-500">Inactivo</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Alerta de perfil incompleto */}
                        {missingFields.length > 0 && (
                          <div className="mt-8 p-5 border border-amber-600/30 bg-amber-600/10 rounded-md">
                            <h4 className="font-medium text-amber-500 flex items-center text-lg mb-3">
                              <AlertTriangle className="h-5 w-5 mr-2" />
                              Perfil Incompleto
                            </h4>
                            <p className="text-sm mb-4">
                              Tu perfil está incompleto. Para mejorar tu experiencia y acceder a todas las
                              funcionalidades, completa los siguientes campos:
                            </p>
                            <ul className="list-disc list-inside text-sm mb-4 space-y-1 pl-2">
                              {missingFields.map((field) => (
                                <li key={field} className="text-gray-light">
                                  {field}
                                </li>
                              ))}
                            </ul>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Completar Perfil
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <p>No se encontró información del usuario</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tickets">
              {/* Panel de tickets del usuario */}
              <div className="bg-dark-gray rounded-md overflow-hidden">
                {/* Cabecera del panel */}
                <div className="bg-gradient-to-r from-burgundy/30 to-dark-gray p-6 flex justify-between items-center border-b border-gray-700">
                  <h2 className="text-xl font-bold flex items-center">
                    <TicketIcon className="h-5 w-5 mr-2 text-gold" />
                    Mis Tickets
                  </h2>
                  <Link href="/tickets" className="text-gold hover:text-gold/80 transition-colors text-sm">
                    Ver todos los tickets disponibles
                  </Link>
                </div>

                {/* Contenido del panel */}
                <div className="p-6">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                      <p className="mt-4">Cargando tus tickets...</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <TicketIcon className="h-16 w-16 mx-auto text-gray-light mb-4" />
                      <h3 className="text-xl font-bold mb-2">No tienes tickets</h3>
                      <p className="text-gray-light mb-8 max-w-md mx-auto">
                        Aún no has reservado ningún ticket para eventos o webinars. Explora nuestros próximos eventos y
                        reserva tu lugar.
                      </p>
                      <Link
                        href="/tickets"
                        className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-3 rounded-md transition-colors inline-block"
                      >
                        Explorar Eventos
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {tickets.map((ticket) => (
                        <TicketCard key={ticket._id} ticket={ticket} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {isExhibitor && (
              <TabsContent value="exhibitor">
                <ExhibitorTab userId={authUser?.id || authUser?._id || ""} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </section>

      {/* Modal de confirmación para cancelar ticket */}
      {showCancelModal && ticketToCancel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-rich-black border border-gray-700 max-w-md w-full p-6 rounded-md relative">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-gray-light hover:text-white"
              aria-label="Cerrar modal"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold mb-4">Confirmar cancelación</h2>
            <p className="mb-6">
              ¿Estás seguro de que deseas cancelar tu ticket para{" "}
              <span className="font-bold">{ticketToCancel.eventTitle}</span>?
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="bg-dark-gray hover:bg-dark-gray/90 text-white px-4 py-2 rounded-md transition-colors"
              >
                No, mantener
              </button>
              <button
                onClick={() => handleCancelTicket(ticketToCancel._id)}
                disabled={isCancelling}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {isCancelling ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}
