"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Navbar from "@/components/navbar"
import { get } from "@/utils/api"
import { API_CONFIG } from "@/utils/api-config"
import { getAllEvents, deleteEvent } from "@/services/event-service"
import type { Event } from "@/services/event-service"
import { getAllWebinars, deleteWebinar, formatWebinarDate } from "@/services/webinar-service"
import type { Webinar } from "@/services/webinar-service"
import { getAllTickets, deleteTicket, type Ticket } from "@/services/ticket-service"
import { getAllBlogs, deleteBlog, updateBlogStatus, type Blog } from "@/services/blog-service"
// Importar el servicio de speakers
import { getAllSpeakers, deleteSpeaker, getSpeakersByEvent, type Speaker } from "@/services/speaker-service"
// Añadir la importación para el servicio de tipos de tickets
import { getAllTicketTypes, deleteTicketType, type TicketType } from "@/services/ticket-type-service"
// Import stand option service
import {
  getAllStandOptions,
  getStandOptionsByEvent,
  deleteStandOption,
  type StandOption,
} from "@/services/stand-option-service"
// Importar Chart.js y componentes relacionados
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2"
// Registrar los componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend)
// Añadir la importación del icono Video
import {
  Calendar,
  MapPin,
  Edit,
  Trash2,
  LinkIcon,
  Plus,
  Search,
  User,
  Eye,
  UserX,
  UserPlus,
  TicketIcon,
  Star,
  FileText,
  BarChart3,
  PieChart,
  Users,
  CalendarIcon,
  Video,
} from "lucide-react"

// Importar el servicio de configuración
import { useSettings, type Settings } from "@/services/settings-service"
import { deleteUser } from "@/services/user-service"

// Importar el componente SettingsTab
import SettingsTab from "./settings-tab"

// Importar el componente EventProgramManager
import EventProgramManager from "@/components/event-program-manager"

// Import ExhibitorPermissionsTab
import ExhibitorPermissionsTab from "./exhibitor-permissions-tab"

// Añadir la importación para el nuevo componente StandConfigsTab
import StandConfigsTab from "./stand-configs-tab"

export default function AdminDashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get("tab") || "users"
  })
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [webinarToDelete, setWebinarToDelete] = useState<Webinar[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEventDeleteModalOpen, setIsEventDeleteModalOpen] = useState(false)
  const [isWebinarDeleteModalOpen, setIsWebinarDeleteModalOpen] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(true)
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null)
  const [isTicketDeleteModalOpen, setIsTicketDeleteModalOpen] = useState(false)
  const [ticketSearchTerm, setTicketSearchTerm] = useState("")
  const [ticketStatusFilter, setTicketStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [selectedTicketEventId, setSelectedTicketEventId] = useState<string | "all">("all")

  // Estados para blogs
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true)
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null)
  const [isBlogDeleteModalOpen, setIsBlogDeleteModalOpen] = useState(false)
  const [blogSearchTerm, setBlogSearchTerm] = useState("")
  const [blogStatusFilter, setBlogStatusFilter] = useState("")

  // Estados para speakers
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [isLoadingSpeakers, setIsLoadingSpeakers] = useState(true)
  const [speakerToDelete, setSpeakerToDelete] = useState<Speaker | null>(null)
  const [isSpeakerDeleteModalOpen, setIsSpeakerDeleteModalOpen] = useState(false)
  const [speakerSearchTerm, setSpeakerSearchTerm] = useState("")
  const [selectedSpeakerEventId, setSelectedSpeakerEventId] = useState<string | "all">("all")

  // Añadir estos estados después de los estados existentes para blogs y speakers
  // Estados para tipos de tickets
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [isLoadingTicketTypes, setIsLoadingTicketTypes] = useState(true)
  const [ticketTypeToDelete, setTicketTypeToDelete] = useState<TicketType | null>(null)
  const [isTicketTypeDeleteModalOpen, setIsTicketTypeDeleteModalOpen] = useState(false)
  const [ticketTypeSearchTerm, setTicketTypeSearchTerm] = useState("")
  const [selectedEventForTicketTypes, setSelectedEventForTicketTypes] = useState<string | "all">("all")

  // Estados para opciones de stand de exhibitors
  const [standOptions, setStandOptions] = useState<StandOption[]>([])
  const [isLoadingStandOptions, setIsLoadingStandOptions] = useState(true)
  const [standOptionToDelete, setStandOptionToDelete] = useState<StandOption | null>(null)
  const [isStandOptionDeleteModalOpen, setIsStandOptionDeleteModalOpen] = useState(false)
  const [standOptionSearchTerm, setStandOptionSearchTerm] = useState("")
  const [selectedEventForStandOptions, setSelectedEventForStandOptions] = useState<string | "all">("all")

  // Añadir un nuevo estado para el filtro de eventos destacados
  const [eventFeaturedFilter, setEventFeaturedFilter] = useState<string>("all")

  // Reemplazar el estado de siteSettings con el hook useSettings
  // Buscar y reemplazar:
  // Con:
  const { settings, loading: settingsLoading, error: settingsError, fetchSettings, saveSettings } = useSettings()
  const [siteSettings, setSiteSettings] = useState<Settings>({
    appName: "Meet the Architect",
    appDescription: "Plataforma para eventos de arquitectura",
    email: "info@meetthearchitect.com",
    phone: "+34 123 456 789",
    address: "Calle Principal 123, Madrid, España",
    socialLinks: [
      "https://facebook.com/meetthearchitect",
      "https://twitter.com/meetarchitect",
      "https://instagram.com/meetthearchitect",
      "https://linkedin.com/company/meetthearchitect",
    ],
    adminEmail: "admin@meetthearchitect.com",
  })

  const [emailSettings, setEmailSettings] = useState({
    enableNotifications: true,
    notifyOnNewUser: true,
    notifyOnNewTicket: true,
    notifyOnNewBlog: false,
    adminEmail: "admin@meetthearchitect.com",
    emailSignature: "El equipo de Meet the Architect",
  })

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 60,
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    maxLoginAttempts: 5,
  })

  const [languageSettings, setLanguageSettings] = useState({
    defaultLanguage: "es",
    availableLanguages: ["es", "en", "de"],
    autoDetectLanguage: true,
  })

  // Estados para estadísticas
  const [statsLoading, setStatsLoading] = useState(true)
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    regularUsers: 0,
    newThisMonth: 0,
    monthlyGrowth: [] as { month: string; count: number }[],
  })

  const [eventStats, setEventStats] = useState({
    total: 0,
    featured: 0,
    upcoming: 0,
    past: 0,
    mostPopular: "",
    byLocation: [] as { location: string; count: number }[],
  })

  const [ticketStats, setTicketStats] = useState({
    total: 0,
    reserved: 0,
    cancelled: 0,
    byEvent: [] as { eventId: string; eventTitle: string; count: number }[],
    byMonth: [] as { month: string; reserved: number; cancelled: number }[],
  })

  const [blogStats, setBlogStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    mostRecent: "",
    byMonth: [] as { month: string; count: number }[],
  })

  // Referencia para los gráficos
  const userChartRef = useRef<HTMLCanvasElement>(null)
  const ticketChartRef = useRef<HTMLCanvasElement>(null)
  const eventChartRef = useRef<HTMLCanvasElement>(null)

  // Nuevo estado para estadísticas de webinars
  const [webinarStats, setWebinarStats] = useState({
    total: 0,
    upcoming: 0,
    past: 0,
    mostPopular: "",
  })

  // Añadir la opción "stand-configs" al array de tabs válidos en el useEffect
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (
      tabParam &&
      [
        "users",
        "events",
        "webinars",
        "tickets",
        "blogs",
        "speakers",
        "programs",
        "stats",
        "settings",
        "ticket-types",
        "exhibitors",
        "exhibitor-permissions",
        "stand-configs",
      ].includes(tabParam) &&
      tabParam !== activeTab
    ) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Añadir esta función después de fetchSpeakers
  // Función para cargar tipos de tickets
  const fetchTicketTypes = async () => {
    try {
      setIsLoadingTicketTypes(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      const ticketTypesData = await getAllTicketTypes(token)
      setTicketTypes(ticketTypesData)
    } catch (err: any) {
      console.error("Error fetching ticket types:", err)
      setError(err.message || "Error al cargar la lista de tipos de tickets")
    } finally {
      setIsLoadingTicketTypes(false)
    }
  }

  // Función para eliminar un tipo de ticket
  const handleDeleteTicketType = async () => {
    if (!ticketTypeToDelete) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await deleteTicketType(ticketTypeToDelete._id, token)

      // Actualizar la lista de tipos de tickets
      setTicketTypes(ticketTypes.filter((type) => type._id !== ticketTypeToDelete._id))
      setSuccessMessage(`Tipo de ticket "${ticketTypeToDelete.name}" eliminado correctamente`)
      setIsTicketTypeDeleteModalOpen(false)
      setTicketTypeToDelete(null)
    } catch (err: any) {
      console.error("Error deleting ticket type:", err)
      setError(err.message || "Error al eliminar el tipo de ticket")
    }
  }

  // Función para cargar speakers
  const fetchSpeakers = async () => {
    try {
      setIsLoadingSpeakers(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      let speakersData: Speaker[]

      if (selectedSpeakerEventId !== "all") {
        // Si hay un evento seleccionado, obtener solo los speakers de ese evento
        speakersData = await getSpeakersByEvent(selectedSpeakerEventId, token)
      } else {
        // Si no, obtener todos los speakers
        speakersData = await getAllSpeakers(token)
      }

      setSpeakers(speakersData)
    } catch (err: any) {
      console.error("Error fetching speakers:", err)
      setError(err.message || "Error al cargar la lista de ponentes")
    } finally {
      setIsLoadingSpeakers(false)
    }
  }

  // Función para eliminar un speaker
  const handleDeleteSpeaker = async () => {
    if (!speakerToDelete) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await deleteSpeaker(speakerToDelete._id, token)

      // Actualizar la lista de speakers
      setSpeakers(speakers.filter((speaker) => speaker._id !== speakerToDelete._id))
      setSuccessMessage(`Ponente "${speakerToDelete.name}" eliminado correctamente`)
      setIsSpeakerDeleteModalOpen(false)
      setSpeakerToDelete(null)
    } catch (err: any) {
      console.error("Error deleting speaker:", err)
      setError(err.message || "Error al eliminar el ponente")
    }
  }

  // Función para cargar opciones de stand
  const fetchStandOptions = async () => {
    try {
      setIsLoadingStandOptions(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      let standOptionsData: StandOption[]

      if (selectedEventForStandOptions !== "all") {
        // Si hay un evento seleccionado, obtener solo las opciones de stand de ese evento
        standOptionsData = await getStandOptionsByEvent(selectedEventForStandOptions, token)
      } else {
        // Si no, obtener todas las opciones de stand
        standOptionsData = await getAllStandOptions(token)
      }

      setStandOptions(standOptionsData)
    } catch (err: any) {
      console.error("Error fetching stand options:", err)
      setError(err.message || "Error al cargar la lista de opciones de stand")
    } finally {
      setIsLoadingStandOptions(false)
    }
  }

  // Función para eliminar una opción de stand
  const handleDeleteStandOption = async () => {
    if (!standOptionToDelete) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await deleteStandOption(standOptionToDelete._id, token)

      // Actualizar la lista de opciones de stand
      setStandOptions(standOptions.filter((option) => option._id !== standOptionToDelete._id))
      setSuccessMessage(`Opción de stand "${standOptionToDelete.title}" eliminada correctamente`)
      setIsStandOptionDeleteModalOpen(false)
      setStandOptionToDelete(null)
    } catch (err: any) {
      console.error("Error deleting stand option:", err)
      setError(err.message || "Error al eliminar la opción de stand")
    }
  }

  // Añadir este efecto después del efecto para recargar los speakers
  // Efecto para cargar los tipos de tickets cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === "ticket-types") {
      fetchEvents()
      fetchTicketTypes()
    }
  }, [activeTab])

  // Efecto para recargar los speakers cuando cambia el evento seleccionado
  useEffect(() => {
    if (activeTab === "speakers") {
      fetchSpeakers()
    }
  }, [selectedSpeakerEventId, activeTab])

  // Efecto para cargar las opciones de stand cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === "exhibitors") {
      fetchEvents()
      fetchStandOptions()
    }
  }, [activeTab, selectedEventForStandOptions])

  // Efecto para cargar estadísticas cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === "stats") {
      loadStatistics()
    }
  }, [activeTab])

  // Añadir un efecto para cargar las configuraciones cuando se active la pestaña
  useEffect(() => {
    if (activeTab === "settings") {
      fetchSettings().then((data) => {
        if (data) {
          setSiteSettings(data)
        }
      })
    }
  }, [activeTab])

  // Función para cargar estadísticas
  const loadStatistics = async () => {
    setStatsLoading(true)
    setError(null)
    try {
      // Cargar todos los datos necesarios para las estadísticas
      // Asegurarnos de que se obtienen los datos completos de la API
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Obtener datos de usuarios
      const usersData = await get<User[]>(API_CONFIG.endpoints.users, token)
      setUsers(usersData)

      // Obtener datos de eventos
      const eventsData = await getAllEvents(token)
      setEvents(eventsData)

      // Obtener datos de webinars
      const webinarsData = await getAllWebinars(token)
      setWebinars(webinarsData)

      // Obtener datos de tickets
      const ticketsData = await getAllTickets()
      setTickets(ticketsData)

      // Obtener datos de blogs
      const blogsData = await getAllBlogs()
      setBlogs(blogsData)

      // Calcular estadísticas de usuarios
      const totalUsers = usersData.length
      const activeUsers = usersData.filter((user) => user.isActive).length
      const inactiveUsers = totalUsers - activeUsers
      const adminUsers = usersData.filter((user) => user.role === "admin").length
      const regularUsers = totalUsers - adminUsers

      // Calcular usuarios nuevos este mes
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const newUsers = usersData.filter((user) => {
        if (!user.createdAt) return false
        const createdDate = new Date(user.createdAt)
        return createdDate >= firstDayOfMonth
      }).length

      // Generar datos de crecimiento mensual de usuarios (últimos 6 meses)
      const monthlyGrowth = generateMonthlyUserGrowth(usersData)

      setUserStats({
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        admins: adminUsers,
        regularUsers: regularUsers,
        newThisMonth: newUsers,
        monthlyGrowth,
      })

      // Calcular estadísticas de eventos
      const totalEvents = eventsData.length
      const featuredEvents = eventsData.filter((event) => event.isFeatured).length
      const now2 = new Date()
      const upcomingEvents = eventsData.filter((event) => new Date(event.date) > now2).length
      const pastEvents = totalEvents - upcomingEvents

      // Encontrar el evento más popular (con más tickets)
      const eventTicketCounts = eventsData.map((event) => {
        const eventTickets = ticketsData.filter((ticket) => ticket.eventId === event._id).length
        return { eventId: event._id, eventTitle: event.title, count: eventTickets }
      })

      eventTicketCounts.sort((a, b) => b.count - a.count)
      const mostPopularEvent = eventTicketCounts.length > 0 ? eventTicketCounts[0].eventTitle : "No hay eventos"

      // Generar datos de eventos por ubicación
      const eventsByLocation = generateEventsByLocation(eventsData)

      setEventStats({
        total: totalEvents,
        featured: featuredEvents,
        upcoming: upcomingEvents,
        past: pastEvents,
        mostPopular: mostPopularEvent,
        byLocation: eventsByLocation,
      })

      // Calcular estadísticas de tickets
      const totalTickets = ticketsData.length
      const reservedTickets = ticketsData.filter((ticket) => ticket.status === "reserved").length
      const cancelledTickets = ticketsData.filter((ticket) => ticket.status === "cancelled").length

      // Generar datos de tickets por mes
      const ticketsByMonth = generateTicketsByMonth(ticketsData)

      setTicketStats({
        total: totalTickets,
        reserved: reservedTickets,
        cancelled: cancelledTickets,
        byEvent: eventTicketCounts,
        byMonth: ticketsByMonth,
      })

      // Calcular estadísticas de webinars
      const totalWebinars = webinarsData.length
      const now3 = new Date()
      const upcomingWebinars = webinarsData.filter((webinar) => new Date(webinar.date) > now3).length
      const pastWebinars = totalWebinars - upcomingWebinars

      // Encontrar el webinar más popular (con más tickets)
      const webinarTicketCounts = webinarsData.map((webinar) => {
        const webinarTickets = ticketsData.filter((ticket) => ticket.webinarId === webinar._id).length
        return { webinarId: webinar._id, webinarTitle: webinar.title, count: webinarTickets }
      })

      webinarTicketCounts.sort((a, b) => b.count - a.count)
      const mostPopularWebinar =
        webinarTicketCounts.length > 0 ? webinarTicketCounts[0].webinarTitle : "No hay webinars"

      // Calcular estadísticas de blogs
      const totalBlogs = blogsData.length
      const publishedBlogs = blogsData.filter((blog) => blog.isPublished).length
      const draftBlogs = totalBlogs - publishedBlogs

      // Encontrar el blog más reciente
      const sortedBlogs = [...blogsData]
      sortedBlogs.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      const mostRecentBlog = sortedBlogs.length > 0 ? sortedBlogs[0].title : "No hay blogs"

      // Generar datos de blogs por mes
      const blogsByMonth = generateBlogsByMonth(blogsData)

      setBlogStats({
        total: totalBlogs,
        published: publishedBlogs,
        drafts: draftBlogs,
        mostRecent: mostRecentBlog,
        byMonth: blogsByMonth,
      })

      // Añadir estadísticas de webinars al estado
      setWebinarStats({
        total: totalWebinars,
        upcoming: upcomingWebinars,
        past: pastWebinars,
        mostPopular: mostPopularWebinar,
      })

      setSuccessMessage("Estadísticas actualizadas correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error loading statistics:", error)
      setError("Error al cargar las estadísticas. Por favor, inténtalo de nuevo.")
    } finally {
      setStatsLoading(false)
    }
  }

  // Función para generar datos de crecimiento mensual de usuarios
  const generateMonthlyUserGrowth = (users: User[]) => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const currentDate = new Date()
    const monthlyData: { month: string; count: number }[] = []

    // Generar datos para los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = months[month.getMonth()]
      const monthYear = `${monthName} ${month.getFullYear()}`

      const usersInMonth = users.filter((user) => {
        if (!user.createdAt) return false
        const createdDate = new Date(user.createdAt)
        return createdDate.getMonth() === month.getMonth() && createdDate.getFullYear() === month.getFullYear()
      }).length

      monthlyData.push({ month: monthName, count: usersInMonth })
    }

    return monthlyData
  }

  // Función para generar datos de eventos por ubicación
  const generateEventsByLocation = (events: Event[]) => {
    const locationCounts: Record<string, number> = {}

    events.forEach((event) => {
      if (event.location) {
        locationCounts[event.location] = (locationCounts[event.location] || 0) + 1
      }
    })

    return Object.entries(locationCounts).map(([location, count]) => ({
      location,
      count,
    }))
  }

  // Función para generar datos de tickets por mes
  const generateTicketsByMonth = (tickets: Ticket[]) => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const currentDate = new Date()
    const monthlyData: { month: string; reserved: number; cancelled: number }[] = []

    // Generar datos para los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = months[month.getMonth()]

      const ticketsInMonth = tickets.filter((ticket) => {
        if (!ticket.createdAt) return false
        const createdDate = new Date(ticket.createdAt)
        return createdDate.getMonth() === month.getMonth() && createdDate.getFullYear() === month.getFullYear()
      })

      const reservedCount = ticketsInMonth.filter((ticket) => ticket.status === "reserved").length
      const cancelledCount = ticketsInMonth.filter((ticket) => ticket.status === "cancelled").length

      monthlyData.push({
        month: monthName,
        reserved: reservedCount,
        cancelled: cancelledCount,
      })
    }

    return monthlyData
  }

  // Función para generar datos de blogs por mes
  const generateBlogsByMonth = (blogs: Blog[]) => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    const currentDate = new Date()
    const monthlyData: { month: string; count: number }[] = []

    // Generar datos para los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthName = months[month.getMonth()]

      const blogsInMonth = blogs.filter((blog) => {
        if (!blog.createdAt) return false
        const createdDate = new Date(blog.createdAt)
        return createdDate.getMonth() === month.getMonth() && createdDate.getFullYear() === month.getFullYear()
      }).length

      monthlyData.push({ month: monthName, count: blogsInMonth })
    }

    return monthlyData
  }

  // Función para renderizar gráficos
  const renderCharts = () => {
    // Esta función simula la renderización de gráficos
    // En una implementación real, usarías una biblioteca como Chart.js
    console.log("Renderizando gráficos con los datos actualizados")
  }

  // Modificar la función saveSettings para guardar la configuración en localStorage
  // Reemplazar la función saveSettings with:

  // Reemplazar la función saveSettings
  const handleSaveSettings = async () => {
    setError(null)
    try {
      const success = await saveSettings(siteSettings)
      if (success) {
        setSuccessMessage("Configuración guardada correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError("Error al guardar la configuración. Por favor, inténtalo de nuevo.")
      }
    } catch (error) {
      console.error("Error al guardar la configuración:", error)
      setError("Error al guardar la configuración. Por favor, inténtalo de nuevo.")
    }
  }

  // También modificar la función saveAllSettings para guardar todas las configuraciones
  // Reemplazar la función saveAllSettings with:

  // Añadir función para guardar todas las configuraciones
  const saveAllSettings = async () => {
    await handleSaveSettings()
  }

  // Añadir función para restaurar valores predeterminados
  const restoreDefaultSettings = async () => {
    setError(null)
    try {
      // Restaurar valores predeterminados
      const defaultSettings = {
        appName: "Meet the Architect",
        appDescription: "Plataforma para eventos de arquitectura",
        email: "info@meetthearchitect.com",
        phone: "+34 123 456 789",
        address: "Calle Principal 123, Madrid, España",
        socialLinks: [
          "https://facebook.com/meetthearchitect",
          "https://twitter.com/meetarchitect",
          "https://instagram.com/meetthearchitect",
        ],
        adminEmail: "admin@meetthearchitect.com",
      }

      setSiteSettings(defaultSettings)
      setSuccessMessage("Valores predeterminados restaurados. Haz clic en Guardar para aplicar los cambios.")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error al restaurar valores predeterminados:", error)
      setError("Error al restaurar los valores predeterminados. Por favor, inténtalo de nuevo.")
    }
  }

  // Añadir función para guardar todas las configuraciones

  // Filtrar tipos de tickets según los criterios de búsqueda
  const filteredTicketTypes = ticketTypes.filter((ticketType) => {
    // Filtrar por término de búsqueda (nombre)
    const matchesSearch =
      ticketTypeSearchTerm === "" ||
      (ticketType.name && ticketType.name.toLowerCase().includes(ticketTypeSearchTerm.toLowerCase()))

    // Filtrar por evento
    const matchesEvent = selectedEventForTicketTypes === "all" || ticketType.eventId === selectedEventForTicketTypes

    return matchesSearch && matchesEvent
  })

  // Filtrar opciones de stand según los criterios de búsqueda
  const filteredStandOptions = standOptions.filter((standOption) => {
    // Filtrar por término de búsqueda (título, descripción)
    const matchesSearch =
      standOptionSearchTerm === "" ||
      (standOption.title && standOption.title.toLowerCase().includes(standOptionSearchTerm.toLowerCase())) ||
      (standOption.description && standOption.description.toLowerCase().includes(standOptionSearchTerm.toLowerCase()))

    // Filtrar por evento
    const matchesEvent = selectedEventForStandOptions === "all" || standOption.event === selectedEventForStandOptions

    return matchesSearch && matchesEvent
  })

  // Filtrar speakers según los criterios de búsqueda
  const filteredSpeakers = speakers.filter((speaker) => {
    // Filtrar por término de búsqueda (nombre, posición, empresa)
    return (
      speakerSearchTerm === "" ||
      (speaker.name && speaker.name.toLowerCase().includes(speakerSearchTerm.toLowerCase())) ||
      (speaker.position && speaker.position.toLowerCase().includes(speakerSearchTerm.toLowerCase())) ||
      (speaker.company && speaker.company.toLowerCase().includes(speakerSearchTerm.toLowerCase()))
    )
  })

  // Función para cargar blogs
  const fetchBlogs = async () => {
    try {
      setIsLoadingBlogs(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      const blogsData = await getAllBlogs(token)
      setBlogs(blogsData)
    } catch (err: any) {
      console.error("Error fetching blogs:", err)
      setError(err.message || "Error al cargar la lista de blogs")
    } finally {
      setIsLoadingBlogs(false)
    }
  }

  // Función para eliminar un blog
  const handleDeleteBlog = async () => {
    if (!blogToDelete) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await deleteBlog(blogToDelete._id, token)

      // Actualizar la lista de blogs
      setBlogs(blogs.filter((blog) => blog._id !== blogToDelete._id))
      setSuccessMessage(`Blog "${blogToDelete.title}" eliminado correctamente`)
      setIsBlogDeleteModalOpen(false)
      setBlogToDelete(null)
    } catch (err: any) {
      console.error("Error deleting blog:", err)
      setError(err.message || "Error al eliminar el blog")
    }
  }

  // Función para cambiar el estado de publicación de un blog
  const handleChangeBlogStatus = async (blogId: string, isPublished: boolean) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await updateBlogStatus(blogId, isPublished, token)

      // Actualizar la lista de blogs
      setBlogs(blogs.map((blog) => (blog._id === blogId ? { ...blog, isPublished } : blog)))
      setSuccessMessage(`Estado del blog actualizado correctamente`)
    } catch (err: any) {
      console.error("Error updating blog status:", err)
      setError(err.message || "Error al actualizar el estado del blog")
    }
  }

  // Filtrar blogs según los criterios de búsqueda
  const filteredBlogs = blogs.filter((blog) => {
    // Filtrar por término de búsqueda (título, autor)
    const matchesSearch =
      blogSearchTerm === "" ||
      (blog.title && blog.title.toLowerCase().includes(blogSearchTerm.toLowerCase())) ||
      (blog.author && blog.author.toLowerCase().includes(blogSearchTerm.toLowerCase()))

    // Filtrar por estado de publicación
    const matchesStatus =
      blogStatusFilter === "" ||
      (blogStatusFilter === "published" && blog.isPublished) ||
      (blogStatusFilter === "draft" && blog.isPublished)

    return matchesSearch && matchesStatus
  })

  const formatBlogDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Mantener las funciones existentes para otras pestañas
  const fetchTickets = async () => {
    try {
      setIsLoadingTickets(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      const ticketsData = await getAllTickets()
      setTickets(ticketsData)
    } catch (err: any) {
      console.error("Error fetching tickets:", err)
      setError(err.message || "Error al cargar la lista de tickets")
    } finally {
      setIsLoadingTickets(false)
    }
  }
  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      const eventsData = await getAllEvents(token)
      setEvents(eventsData)
    } catch (err: any) {
      console.error("Error fetching events:", err)
      setError(err.message || "Error al cargar la lista de eventos")
    } finally {
      setIsLoading(false)
    }
  }

  // Modificar la función de filtrado de eventos para incluir el filtro por destacado
  const filteredEvents = events.filter((event) => {
    // Filtrar por término de búsqueda (título, descripción, ubicación)
    const matchesSearch =
      searchTerm === "" ||
      (event.title && event.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filtrar por destacado
    const matchesFeatured =
      eventFeaturedFilter === "all" ||
      (eventFeaturedFilter === "featured" && event.isFeatured) ||
      (eventFeaturedFilter === "notFeatured" && !event.isFeatured)

    return matchesSearch && matchesFeatured
  })

  const fetchWebinars = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      const webinarsData = await getAllWebinars(token)
      setWebinars(webinarsData)
    } catch (err: any) {
      console.error("Error fetching webinars:", err)
      setError(err.message || "Error al cargar la lista de webinars")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      const usersData = await get<User[]>(API_CONFIG.endpoints.users, token)
      setUsers(usersData)
    } catch (err: any) {
      console.error("Error fetching users:", err)
      setError(err.message || "Error al cargar la lista de usuarios")
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar tickets según los criterios de búsqueda y el evento seleccionado
  const filteredTickets = tickets.filter((ticket) => {
    // Filtrar por término de búsqueda (ID, usuario, evento)
    const matchesSearch =
      ticketSearchTerm === "" ||
      (ticket._id && ticket._id.toLowerCase().includes(ticketSearchTerm.toLowerCase())) ||
      (ticket.username && ticket.username.toLowerCase().includes(ticketSearchTerm.toLowerCase())) ||
      (ticket.eventTitle && ticket.eventTitle.toLowerCase().includes(ticketSearchTerm.toLowerCase()))

    // Filtrar por evento seleccionado
    const matchesEvent = selectedTicketEventId === "all" || ticket.eventId === selectedTicketEventId

    // Filtrar por estado si hay un filtro de estado activo
    const matchesStatus = ticketStatusFilter === "" || ticket.status === ticketStatusFilter

    return matchesSearch && matchesEvent && matchesStatus
  })
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Función para obtener el nombre del evento a partir del ID
  const getEventNameById = (eventId: string) => {
    const event = events.find((e) => e._id === eventId)
    return event ? event.title : "Evento desconocido"
  }

  useEffect(() => {
    switch (activeTab) {
      case "users":
        fetchUsers()
        break
      case "events":
        fetchEvents()
        break
      case "webinars":
        fetchWebinars()
        break
      case "tickets":
        fetchTickets()
        fetchEvents() // Añadir esta línea para cargar los eventos al seleccionar la pestaña tickets
        break
      case "blogs":
        fetchBlogs()
        break
      case "speakers":
        fetchSpeakers()
        fetchEvents() // Añadir esta línea para cargar los eventos al seleccionar la pestaña speakers
        break
      case "ticket-types":
        fetchTicketTypes()
        fetchEvents() // Asegurarnos de que los eventos se carguen también para los tipos de tickets
        break
      case "exhibitors":
        fetchStandOptions()
        fetchEvents()
        break
      default:
        break
    }
  }, [activeTab])

  // Función para eliminar un usuario
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Llamar al servicio para eliminar el usuario
      await deleteUser(userToDelete._id, token)

      // Actualizar la lista de usuarios
      setUsers(users.filter((user) => user._id !== userToDelete._id))
      setSuccessMessage(`Usuario "${userToDelete.username}" eliminado correctamente`)
      setIsDeleteModalOpen(false)
      setUserToDelete(null)
    } catch (err: any) {
      console.error("Error deleting user:", err)
      setError(err.message || "Error al eliminar el usuario")
    }
  }

  // Función para eliminar un evento
  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await deleteEvent(eventToDelete._id, token)

      // Actualizar la lista de eventos
      setEvents(events.filter((event) => event._id !== eventToDelete._id))
      setSuccessMessage(`Evento "${eventToDelete.title}" eliminado correctamente`)
      setIsEventDeleteModalOpen(false)
      setEventToDelete(null)
    } catch (err: any) {
      console.error("Error deleting event:", err)
      setError(err.message || "Error al eliminar el evento")
    }
  }

  // Función para eliminar un webinar
  const handleDeleteWebinar = async () => {
    if (!webinarToDelete) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await deleteWebinar(webinarToDelete._id, token)

      // Actualizar la lista de webinars
      setWebinars(webinars.filter((webinar) => webinar._id !== webinarToDelete._id))
      setSuccessMessage(`Webinar "${webinarToDelete.title}" eliminado correctamente`)
      setIsWebinarDeleteModalOpen(false)
      setWebinarToDelete(null)
    } catch (err: any) {
      console.error("Error deleting webinar:", err)
      setError(err.message || "Error al eliminar el webinar")
    }
  }

  // Función para eliminar un ticket
  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await deleteTicket(ticketToDelete._id, token)

      // Actualizar la lista de tickets
      setTickets(tickets.filter((ticket) => ticket._id !== ticketToDelete._id))
      setSuccessMessage(`Ticket "${ticketToDelete._id}" eliminado correctamente`)
      setIsTicketDeleteModalOpen(false)
      setTicketToDelete(null)
    } catch (err: any) {
      console.error("Error deleting ticket:", err)
      setError(err.message || "Error al eliminar el ticket")
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesRole = roleFilter === "" || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Preparar datos para los gráficos
  const userChartData = {
    labels: userStats.monthlyGrowth.map((item) => item.month),
    datasets: [
      {
        label: "Nuevos usuarios",
        data: userStats.monthlyGrowth.map((item) => item.count),
        backgroundColor: "rgba(153, 27, 27, 0.7)",
        borderColor: "rgba(153, 27, 27, 1)",
        borderWidth: 1,
      },
    ],
  }

  const userRoleChartData = {
    labels: ["Administradores", "Usuarios regulares"],
    datasets: [
      {
        data: [userStats.admins, userStats.regularUsers],
        backgroundColor: ["rgba(153, 27, 27, 0.7)", "rgba(212, 175, 55, 0.7)"],
        borderColor: ["rgba(153, 27, 27, 1)", "rgba(212, 175, 55, 1)"],
        borderWidth: 1,
      },
    ],
  }

  const eventLocationChartData = {
    labels: eventStats.byLocation.map((item) => item.location),
    datasets: [
      {
        label: "Eventos por ubicación",
        data: eventStats.byLocation.map((item) => item.count),
        backgroundColor: [
          "rgba(153, 27, 27, 0.7)",
          "rgba(212, 175, 55, 0.7)",
          "rgba(59, 130, 246, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(139, 92, 246, 0.7)",
        ],
        borderColor: [
          "rgba(153, 27, 27, 1)",
          "rgba(212, 175, 55, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(139, 92, 246, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  const ticketChartData = {
    labels: ticketStats.byMonth.map((item) => item.month),
    datasets: [
      {
        label: "Tickets reservados",
        data: ticketStats.byMonth.map((item) => item.reserved),
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
      },
      {
        label: "Tickets cancelados",
        data: ticketStats.byMonth.map((item) => item.cancelled),
        backgroundColor: "rgba(239, 68, 68, 0.7)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 1,
      },
    ],
  }

  const blogChartData = {
    labels: blogStats.byMonth.map((item) => item.month),
    datasets: [
      {
        label: "Blogs publicados",
        data: blogStats.byMonth.map((item) => item.count),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        tension: 0.4,
      },
    ],
  }

  // Opciones comunes para los gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "white",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
      },
    },
    scales: {
      x: {
        ticks: {
          color: "white",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      y: {
        ticks: {
          color: "white",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        beginAtZero: true,
      },
    },
  }

  // Opciones para gráficos de tipo pie/doughnut
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "white",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
      },
    },
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Panel de Administración</h1>

          {error && (
            <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-4">
              <p className="text-white">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-900/20 border border-green-500 p-4 rounded-md mb-4">
              <p className="text-white">{successMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar con opciones */}
            <div className="bg-dark-gray p-6 rounded-lg h-fit">
              <h2 className="text-xl font-bold mb-4">Administración</h2>
              <nav className="space-y-2">
                <button
                  onClick={() => router.push("/admin/dashboard?tab=users")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "users" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Gestión de Usuarios
                </button>
                <button
                  onClick={() => router.push("/admin/dashboard?tab=events")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "events" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Gestión de Eventos
                </button>
                <button
                  onClick={() => router.push("/admin/dashboard?tab=webinars")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "webinars" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Gestión de Webinars
                </button>
                <button
                  onClick={() => router.push("/admin/dashboard?tab=tickets")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "tickets" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Gestión de Tickets
                </button>
                {/* Nueva pestaña para blogs */}
                <button
                  onClick={() => router.push("/admin/dashboard?tab=blogs")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "blogs" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Gestión de Blogs
                </button>
                {/* Nueva pestaña para speakers */}
                <button
                  onClick={() => router.push("/admin/dashboard?tab=speakers")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "speakers" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Gestión de Ponentes
                </button>
                <button
                  onClick={() => router.push("/admin/dashboard?tab=programs")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "programs" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Gestión de Programas
                </button>
                <button
                  onClick={() => router.push("/admin/dashboard?tab=exhibitors")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "exhibitors" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Gestión de Exhibitors
                </button>
                <button
                  onClick={() => router.push("/admin/dashboard?tab=exhibitor-permissions")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "exhibitor-permissions" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Permisos Exhibitors
                </button>
                {/* Añadir el botón para la nueva pestaña en la sección de navegación, después del botón de "Permisos Exhibitors" */}
                <button
                  onClick={() => router.push("/admin/dashboard?tab=stand-configs")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "stand-configs" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Configuraciones de Stands
                </button>
                {/* Añadir este botón en la sección de navegación, después del botón de "Gestión de Speakers" */}
                <button
                  onClick={() => router.push("/admin/dashboard?tab=ticket-types")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "ticket-types" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Gestión Precio Tickets
                </button>
                <button
                  onClick={() => router.push("/admin/dashboard?tab=stats")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "stats" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Estadísticas
                </button>
                <button
                  onClick={() => router.push("/admin/dashboard?tab=settings")}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    activeTab === "settings" ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
                  }`}
                >
                  Configuración
                </button>
              </nav>
            </div>

            {/* Contenido principal */}
            <div className="md:col-span-3 bg-dark-gray p-6 rounded-lg">
              {/* Gestión de Usuarios */}
              {activeTab === "users" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Users className="h-6 w-6 text-burgundy" />
                      <span>Gestión de Usuarios</span>
                    </h2>
                    <Link
                      href="/admin/users/new"
                      className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Crear Usuario</span>
                    </Link>
                  </div>

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
                      <input
                        type="text"
                        placeholder="Buscar usuarios..."
                        className="w-full pl-10 pr-4 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="">Todos los roles</option>
                      <option value="admin">Administradores</option>
                      <option value="user">Usuarios</option>
                    </select>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                      <p className="mt-4 text-gray-light">Cargando usuarios...</p>
                    </div>
                  ) : (
                    <div className="bg-rich-black rounded-lg overflow-hidden">
                      {filteredUsers.length > 0 ? (
                        <div className="grid gap-4">
                          {/* Encabezado de tipo de usuario - cambiado de <th> a <div> */}

                          {filteredUsers.map((user) => (
                            <div
                              key={user.id || user._id}
                              className="bg-dark-gray p-4 rounded-lg border border-transparent hover:border-gold/30 transition-all"
                            >
                              <div className="flex flex-col sm:flex-row justify-between">
                                <div className="mb-4 sm:mb-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                                      <User className="h-5 w-5 text-burgundy" />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-lg">{user.username}</h3>
                                      <p className="text-gray-light text-sm">{user.email}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-3 mt-3">
                                    {user.userType && (
                                      <span
                                        className={`px-2 py-1 text-xs rounded-full ${
                                          user.userType === "exhibitor"
                                            ? "bg-purple-900/20 text-purple-400 border border-purple-500/30"
                                            : "bg-blue-900/20 text-blue-400 border border-blue-500/30"
                                        }`}
                                      >
                                        {user.userType === "exhibitor" ? "Exhibidor" : "Visitante"}
                                      </span>
                                    )}
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${
                                        user.isActive
                                          ? "bg-green-900/20 text-green-500 border border-green-500/30"
                                          : "bg-red-900/20 text-red-500 border border-red-500/30"
                                      }`}
                                    >
                                      {user.isActive ? "Activo" : "Inactivo"}
                                    </span>
                                    <span className="px-2 py-1 text-xs rounded-full bg-gold/10 text-gold border border-gold/30 capitalize">
                                      {user.role}
                                    </span>
                                    {user.cargo && (
                                      <span className="px-2 py-1 text-xs rounded-full bg-gray-700/30 text-gray-light border border-gray-600/30">
                                        {user.cargo}
                                      </span>
                                    )}
                                    {user.empresa && (
                                      <span className="px-2 py-1 text-xs rounded-full bg-gray-700/30 text-gray-light border border-gray-600/30">
                                        {user.empresa}
                                      </span>
                                    )}
                                    {user.paisResidencia && (
                                      <span className="px-2 py-1 text-xs rounded-full bg-gray-700/30 text-gray-light border border-gray-600/30">
                                        {user.paisResidencia}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 items-start">
                                  <Link
                                    href={`/admin/users/${user.id || user._id}`}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-gold/50 hover:bg-gold/10 text-gold rounded-md transition-colors text-sm"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span>Ver</span>
                                  </Link>
                                  <Link
                                    href={`/admin/users/${user.id || user._id}/edit`}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-sm"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span>Editar</span>
                                  </Link>
                                  <button
                                    onClick={() => {
                                      setUserToDelete(user)
                                      setIsDeleteModalOpen(true)
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500 rounded-md transition-colors text-sm"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </div>

                              {/* Información adicional colapsable */}
                              <div className="mt-4 pt-4 border-t border-gray-700/50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-light">ID</p>
                                    <p className="font-mono text-xs">{(user.id || user._id)?.substring(0, 10)}...</p>
                                  </div>
                                  {user.createdAt && (
                                    <div>
                                      <p className="text-gray-light">Creado</p>
                                      <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  )}
                                  {user.updatedAt && (
                                    <div>
                                      <p className="text-gray-light">Actualizado</p>
                                      <p>{new Date(user.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-gray-light">Acciones rápidas</p>
                                    <div className="flex gap-2 mt-1">
                                      <button
                                        className="text-xs px-2 py-1 bg-gold/10 text-gold rounded hover:bg-gold/20 transition-colors"
                                        onClick={() => {
                                          // Aquí iría la lógica para resetear la contraseña
                                        }}
                                      >
                                        Resetear contraseña
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-dark-gray rounded-lg">
                          <UserX className="h-12 w-12 mx-auto text-gray-light mb-4" />
                          <h3 className="text-xl font-bold mb-2">No hay usuarios</h3>
                          <p className="text-gray-light mb-6">No se encontraron usuarios en el sistema.</p>
                          <Link
                            href="/admin/users/new"
                            className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors inline-flex items-center gap-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span>Crear primer usuario</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Paginación */}
                  {filteredUsers.length > 0 && (
                    <div className="mt-6 flex justify-between items-center">
                      <p className="text-sm text-gray-light">
                        Mostrando <span className="font-medium">{filteredUsers.length}</span> usuarios
                      </p>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-rich-black border border-gray-700 rounded-md hover:bg-dark-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          Anterior
                        </button>
                        <button className="px-3 py-1 bg-rich-black border border-gray-700 rounded-md hover:bg-dark-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gestión de Eventos */}
              {activeTab === "events" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <CalendarIcon className="h-6 w-6 text-burgundy" />
                      <span>Gestión de Eventos</span>
                    </h2>
                    <Link
                      href="/admin/events/new"
                      className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Crear Evento</span>
                    </Link>
                  </div>
                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
                      <input
                        type="text"
                        placeholder="Buscar eventos..."
                        className="w-full pl-10 pr-4 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      value={eventFeaturedFilter}
                      onChange={(e) => setEventFeaturedFilter(e.target.value)}
                    >
                      <option value="all">Todos los eventos</option>
                      <option value="featured">Destacados</option>
                      <option value="notFeatured">No destacados</option>
                    </select>
                  </div>
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                      <p className="mt-4 text-gray-light">Cargando eventos...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.length > 0 ? (
                        filteredEvents.map((event) => (
                          <div
                            key={event._id}
                            className="bg-dark-gray p-4 rounded-lg border border-transparent hover:border-gold/30 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row justify-between">
                              <div className="mb-4 sm:mb-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                                    <CalendarIcon className="h-5 w-5 text-burgundy" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg">{event.title}</h3>
                                    <div className="flex items-center text-gray-light text-sm">
                                      <MapPin className="h-4 w-4 mr-1 text-gold" />
                                      <span>{event.location}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-3 mt-3">
                                  {event.isFeatured && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-gold/10 text-gold border border-gold/30">
                                      <Star className="h-3 w-3 inline mr-1" />
                                      Destacado
                                    </span>
                                  )}
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-900/20 text-blue-400 border border-blue-500/30">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    {formatDate(event.date)}
                                  </span>
                                </div>

                                <p className="text-gray-light mt-3 text-sm line-clamp-2">{event.description}</p>
                              </div>

                              <div className="flex flex-wrap gap-2 items-start">
                                <Link
                                  href={`/admin/events/${event._id}`}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-gold/50 hover:bg-gold/10 text-gold rounded-md transition-colors text-sm"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>Ver</span>
                                </Link>
                                <Link
                                  href={`/admin/events/${event._id}/edit`}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-sm"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span>Editar</span>
                                </Link>
                                <button
                                  onClick={() => {
                                    setEventToDelete(event)
                                    setIsEventDeleteModalOpen(true)
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500 rounded-md transition-colors text-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-dark-gray rounded-lg">
                          <CalendarIcon className="h-12 w-12 mx-auto text-gray-light mb-4" />
                          <h3 className="text-xl font-bold mb-2">No hay eventos</h3>
                          <p className="text-gray-light mb-6">No se encontraron eventos en el sistema.</p>
                          <Link
                            href="/admin/events/new"
                            className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors inline-flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Crear primer evento</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Paginación */}
                  {filteredEvents.length > 0 && (
                    <div className="mt-6 flex justify-between items-center">
                      <p className="text-sm text-gray-light">
                        Mostrando <span className="font-medium">{filteredEvents.length}</span> eventos
                      </p>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-rich-black border border-gray-700 rounded-md hover:bg-dark-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          Anterior
                        </button>
                        <button className="px-3 py-1 bg-rich-black border border-gray-700 rounded-md hover:bg-dark-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gestión de Webinars */}
              {activeTab === "webinars" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Video className="h-6 w-6 text-burgundy" />
                      <span>Gestión de Webinars</span>
                    </h2>
                    <Link
                      href="/admin/webinars/new"
                      className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Crear Webinar</span>
                    </Link>
                  </div>

                  {/* Barra de búsqueda */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
                      <input
                        type="text"
                        placeholder="Buscar webinars..."
                        className="w-full pl-10 pr-4 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                      <p className="mt-4 text-gray-light">Cargando webinars...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {webinars.length > 0 ? (
                        webinars.map((webinar) => (
                          <div
                            key={webinar._id}
                            className="bg-dark-gray p-4 rounded-lg border border-transparent hover:border-gold/30 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row justify-between">
                              <div className="mb-4 sm:mb-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                                    <Video className="h-5 w-5 text-burgundy" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg">{webinar.title}</h3>
                                    <div className="flex items-center text-gray-light text-sm">
                                      <Calendar className="h-4 w-4 mr-1 text-gold" />
                                      <span>{formatWebinarDate(webinar.date)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-3 mt-3">
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-900/20 text-blue-400 border border-blue-500/30">
                                    <LinkIcon className="h-3 w-3 inline mr-1" />
                                    <a
                                      href={webinar.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      Enlace al webinar
                                    </a>
                                  </span>
                                </div>

                                <p className="text-gray-light mt-3 text-sm line-clamp-2">{webinar.description}</p>
                              </div>

                              <div className="flex flex-wrap gap-2 items-start">
                                <Link
                                  href={`/admin/webinars/${webinar._id}`}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-gold/50 hover:bg-gold/10 text-gold rounded-md transition-colors text-sm"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>Ver</span>
                                </Link>
                                <Link
                                  href={`/admin/webinars/${webinar._id}/edit`}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-sm"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span>Editar</span>
                                </Link>
                                <button
                                  onClick={() => {
                                    setWebinarToDelete(webinar)
                                    setIsWebinarDeleteModalOpen(true)
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500 rounded-md transition-colors text-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-dark-gray rounded-lg">
                          <Video className="h-12 w-12 mx-auto text-gray-light mb-4" />
                          <h3 className="text-xl font-bold mb-2">No hay webinars</h3>
                          <p className="text-gray-light mb-6">No se encontraron webinars en el sistema.</p>
                          <Link
                            href="/admin/webinars/new"
                            className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors inline-flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Crear primer webinar</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Gestión de Tickets */}
              {activeTab === "tickets" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <TicketIcon className="h-5 w-5" />
                      <span>Gestión de Tickets</span>
                    </h2>
                  </div>

                  {/* Desplegable para filtrar por evento */}
                  <div className="mb-4">
                    <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="eventFilter">
                      Filtrar por evento
                    </label>
                    <select
                      id="eventFilter"
                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      value={selectedTicketEventId}
                      onChange={(e) => setSelectedTicketEventId(e.target.value)}
                    >
                      <option value="all">Todos los tickets</option>
                      {events.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
                      <input
                        type="text"
                        placeholder="Buscar tickets..."
                        className="w-full pl-10 pr-4 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        value={ticketSearchTerm}
                        onChange={(e) => setTicketSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {isLoadingTickets ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                      <p className="mt-4 text-gray-light">Cargando tickets...</p>
                    </div>
                  ) : (
                    <div className="bg-rich-black rounded-lg overflow-hidden">
                      {filteredTickets.length > 0 ? (
                        <div className="grid gap-4">
                          {filteredTickets.map((ticket) => (
                            <div
                              key={ticket._id}
                              className="bg-dark-gray p-4 rounded-lg border border-transparent hover:border-gold/30 transition-all"
                            >
                              <div className="flex flex-col sm:flex-row justify-between">
                                <div className="mb-4 sm:mb-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                                      <TicketIcon className="h-5 w-5 text-burgundy" />
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-lg">{ticket.eventTitle}</h3>
                                      <p className="text-gray-light text-sm">Usuario: {ticket.username}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-3 mt-3">
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${
                                        ticket.status === "reserved"
                                          ? "bg-green-900/20 text-green-500 border border-green-500/30"
                                          : "bg-red-900/20 text-red-500 border border-red-500/30"
                                      }`}
                                    >
                                      {ticket.status === "reserved" ? "Reservado" : "Cancelado"}
                                    </span>
                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-700/30 text-gray-light border border-gray-600/30">
                                      ID: {ticket._id.substring(0, 8)}...
                                    </span>
                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-700/30 text-gray-light border border-gray-600/30">
                                      Creado: {new Date(ticket.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      setTicketToDelete(ticket)
                                      setIsTicketDeleteModalOpen(true)
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500 rounded-md transition-colors text-sm"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </div>

                              {/* Información adicional colapsable */}
                              <div className="mt-4 pt-4 border-t border-gray-700/50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-light">ID de Evento</p>
                                    <p className="font-mono text-xs">{ticket.eventId}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-light">ID de Usuario</p>
                                    <p className="font-mono text-xs">{ticket.userId}</p>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <p className="text-gray-light">Descripción</p>
                                    <p className="text-sm">{ticket.eventDescription}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-dark-gray rounded-lg">
                          <TicketIcon className="h-12 w-12 mx-auto text-gray-light mb-4" />
                          <h3 className="text-xl font-bold mb-2">No hay tickets</h3>
                          <p className="text-gray-light mb-6">No se encontraron tickets en el sistema.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Paginación */}
                  {filteredTickets.length > 0 && (
                    <div className="mt-6 flex justify-between items-center">
                      <p className="text-sm text-gray-light">
                        Mostrando <span className="font-medium">{filteredTickets.length}</span> tickets
                      </p>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-rich-black border border-gray-700 rounded-md hover:bg-dark-gray transition-colors disabled:opacity-50">
                          Anterior
                        </button>
                        <button className="px-3 py-1 bg-rich-black border border-gray-700 rounded-md hover:bg-dark-gray transition-colors disabled:opacity-50">
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gestión de Estadísticas */}
              {/* Modificar la sección de estadísticas para incluir webinars */}
              {activeTab === "stats" && (
                <div>
                  <h2 className="text-xl font-bold mb-6">Estadísticas</h2>

                  {statsLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                      <p className="mt-4">Cargando estadísticas...</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Resumen general */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="bg-rich-black p-4 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-burgundy" />
                            </div>
                            <div>
                              <h3 className="text-sm text-gray-light">Usuarios</h3>
                              <p className="text-2xl font-bold">{userStats.total}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-light">
                            <span className="text-green-500">{userStats.active}</span> activos,{" "}
                            <span className="text-red-500">{userStats.inactive}</span> inactivos
                          </div>
                        </div>

                        <div className="bg-rich-black p-4 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                              <CalendarIcon className="h-5 w-5 text-burgundy" />
                            </div>
                            <div>
                              <h3 className="text-sm text-gray-light">Eventos</h3>
                              <p className="text-2xl font-bold">{eventStats.total}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-light">
                            <span className="text-gold">{eventStats.featured}</span> destacados,{" "}
                            <span className="text-blue-400">{eventStats.upcoming}</span> próximos
                          </div>
                        </div>

                        <div className="bg-rich-black p-4 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                              <Video className="h-5 w-5 text-burgundy" />
                            </div>
                            <div>
                              <h3 className="text-sm text-gray-light">Webinars</h3>
                              <p className="text-2xl font-bold">{webinarStats.total}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-light">
                            <span className="text-blue-400">{webinarStats.upcoming}</span> próximos,{" "}
                            <span className="text-gray-400">{webinarStats.past}</span> pasados
                          </div>
                        </div>

                        <div className="bg-rich-black p-4 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                              <TicketIcon className="h-5 w-5 text-burgundy" />
                            </div>
                            <div>
                              <h3 className="text-sm text-gray-light">Tickets</h3>
                              <p className="text-2xl font-bold">{ticketStats.total}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-light">
                            <span className="text-green-500">{ticketStats.reserved}</span> reservados,{" "}
                            <span className="text-red-500">{ticketStats.cancelled}</span> cancelados
                          </div>
                        </div>

                        <div className="bg-rich-black p-4 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                              <FileText className="h-5 w-5 text-burgundy" />
                            </div>
                            <div>
                              <h3 className="text-sm text-gray-light">Blogs</h3>
                              <p className="text-2xl font-bold">{blogStats.total}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-light">
                            <span className="text-green-500">{blogStats.published}</span> publicados,{" "}
                            <span className="text-yellow-500">{blogStats.drafts}</span> borradores
                          </div>
                        </div>
                      </div>

                      {/* Gráficos y estadísticas detalladas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Usuarios */}
                        <div className="bg-rich-black p-6 rounded-lg">
                          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-burgundy" />
                            Estadísticas de Usuarios
                          </h3>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Total de usuarios:</span>
                              <span className="font-bold">{userStats.total}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Administradores:</span>
                              <span className="font-bold">{userStats.admins}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Usuarios regulares:</span>
                              <span className="font-bold">{userStats.regularUsers}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Usuarios activos:</span>
                              <span className="font-bold text-green-500">{userStats.active}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Usuarios inactivos:</span>
                              <span className="font-bold text-red-500">{userStats.inactive}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Nuevos este mes:</span>
                              <span className="font-bold text-blue-400">{userStats.newThisMonth}</span>
                            </div>
                          </div>

                          <div className="mt-6 h-64 bg-dark-gray rounded-md flex items-center justify-center">
                            <div className="w-full h-full p-4">
                              <Bar data={userChartData} options={chartOptions} />
                            </div>
                          </div>
                        </div>

                        {/* Eventos */}
                        <div className="bg-rich-black p-6 rounded-lg">
                          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-burgundy" />
                            Estadísticas de Eventos
                          </h3>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Total de eventos:</span>
                              <span className="font-bold">{eventStats.total}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Eventos destacados:</span>
                              <span className="font-bold text-gold">{eventStats.featured}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Eventos próximos:</span>
                              <span className="font-bold text-blue-400">{eventStats.upcoming}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Eventos pasados:</span>
                              <span className="font-bold text-gray-400">{eventStats.past}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Evento más popular:</span>
                              <span className="font-bold text-burgundy">{eventStats.mostPopular}</span>
                            </div>
                          </div>

                          <div className="mt-6 h-64 bg-dark-gray rounded-md flex items-center justify-center">
                            <div className="w-full h-full p-4">
                              <Pie data={eventLocationChartData} options={pieChartOptions} />
                            </div>
                          </div>
                        </div>

                        {/* Webinars */}
                        <div className="bg-rich-black p-6 rounded-lg">
                          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Video className="h-5 w-5 text-burgundy" />
                            Estadísticas de Webinars
                          </h3>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Total de webinars:</span>
                              <span className="font-bold">{webinarStats.total}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Webinars próximos:</span>
                              <span className="font-bold text-blue-400">{webinarStats.upcoming}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Webinars pasados:</span>
                              <span className="font-bold text-gray-400">{webinarStats.past}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Webinar más popular:</span>
                              <span className="font-bold text-burgundy">{webinarStats.mostPopular}</span>
                            </div>
                          </div>

                          <div className="mt-6 h-64 bg-dark-gray rounded-md flex items-center justify-center">
                            <div className="w-full h-full p-4 flex items-center justify-center">
                              {webinarStats.total > 0 ? (
                                <Doughnut
                                  data={{
                                    labels: ["Próximos", "Pasados"],
                                    datasets: [
                                      {
                                        data: [webinarStats.upcoming, webinarStats.past],
                                        backgroundColor: ["rgba(59, 130, 246, 0.7)", "rgba(156, 163, 175, 0.7)"],
                                        borderColor: ["rgba(59, 130, 246, 1)", "rgba(156, 163, 175, 1)"],
                                        borderWidth: 1,
                                      },
                                    ],
                                  }}
                                  options={pieChartOptions}
                                />
                              ) : (
                                <p className="text-gray-light">No hay datos de webinars disponibles</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tickets */}
                        <div className="bg-rich-black p-6 rounded-lg">
                          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <TicketIcon className="h-5 w-5 text-burgundy" />
                            Estadísticas de Tickets
                          </h3>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Total de tickets:</span>
                              <span className="font-bold">{ticketStats.total}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Tickets reservados:</span>
                              <span className="font-bold text-green-500">{ticketStats.reserved}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Tickets cancelados:</span>
                              <span className="font-bold text-red-500">{ticketStats.cancelled}</span>
                            </div>
                          </div>

                          <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Tickets por evento:</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                              {ticketStats.byEvent.length > 0 ? (
                                ticketStats.byEvent.map((eventStat, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-light truncate max-w-[70%]">{eventStat.eventTitle}</span>
                                    <span className="font-bold">{eventStat.count}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-light text-sm">No hay datos disponibles</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-6 h-48 bg-dark-gray rounded-md flex items-center justify-center">
                            <div className="w-full h-full p-4">
                              <Bar data={ticketChartData} options={chartOptions} />
                            </div>
                          </div>
                        </div>

                        {/* Blogs */}
                        <div className="bg-rich-black p-6 rounded-lg">
                          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-burgundy" />
                            Estadísticas de Blogs
                          </h3>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Total de blogs:</span>
                              <span className="font-bold">{blogStats.total}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Blogs publicados:</span>
                              <span className="font-bold text-green-500">{blogStats.published}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Blogs en borrador:</span>
                              <span className="font-bold text-yellow-500">{blogStats.drafts}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-gray-light">Blog más reciente:</span>
                              <span className="font-bold text-burgundy truncate max-w-[60%]">
                                {blogStats.mostRecent}
                              </span>
                            </div>
                          </div>

                          <div className="mt-6 h-48 bg-dark-gray rounded-md flex items-center justify-center">
                            <div className="w-full h-full p-4">
                              <Line data={blogChartData} options={chartOptions} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gráficos adicionales */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Distribución de roles de usuario */}
                        <div className="bg-rich-black p-6 rounded-lg">
                          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Users className="h-5 w-5 text-burgundy" />
                            Distribución de Roles
                          </h3>
                          <div className="h-64 bg-dark-gray rounded-md flex items-center justify-center">
                            <div className="w-full h-full p-4">
                              <Doughnut data={userRoleChartData} options={pieChartOptions} />
                            </div>
                          </div>
                        </div>

                        {/* Distribución de tickets por tipo */}
                        <div className="bg-rich-black p-6 rounded-lg">
                          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <TicketIcon className="h-5 w-5 text-burgundy" />
                            Distribución de Tickets
                          </h3>
                          <div className="h-64 bg-dark-gray rounded-md flex items-center justify-center">
                            <div className="w-full h-full p-4">
                              <Doughnut
                                data={{
                                  labels: ["Eventos", "Webinars"],
                                  datasets: [
                                    {
                                      data: [
                                        tickets.filter((t) => t.type === "event").length,
                                        tickets.filter((t) => t.type === "webinar").length,
                                      ],
                                      backgroundColor: ["rgba(153, 27, 27, 0.7)", "rgba(59, 130, 246, 0.7)"],
                                      borderColor: ["rgba(153, 27, 27, 1)", "rgba(59, 130, 246, 1)"],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={pieChartOptions}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-wrap gap-4 justify-end mt-8">
                        <button
                          onClick={() => loadStatistics()}
                          className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          Recargar Estadísticas
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Configuración */}
              {activeTab === "settings" && <SettingsTab />}

              {/* Gestión de Blogs */}
              {activeTab === "blogs" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span>Gestión de Blogs</span>
                    </h2>
                    <Link
                      href="/admin/blogs/new"
                      className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Crear Blog</span>
                    </Link>
                  </div>

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
                      <input
                        type="text"
                        placeholder="Buscar blogs..."
                        className="w-full pl-10 pr-4 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        value={blogSearchTerm}
                        onChange={(e) => setBlogSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      value={blogStatusFilter}
                      onChange={(e) => setBlogStatusFilter(e.target.value)}
                    >
                      <option value="">Todos los estados</option>
                      <option value="published">Publicados</option>
                      <option value="draft">Borradores</option>
                    </select>
                  </div>

                  {isLoadingBlogs ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                      <p className="mt-4 text-gray-light">Cargando blogs...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {blogs.length > 0 ? (
                        filteredBlogs.map((blog) => (
                          <div
                            key={blog._id}
                            className="bg-dark-gray p-4 rounded-lg border border-transparent hover:border-gold/30 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row justify-between">
                              <div className="mb-4 sm:mb-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-burgundy" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg">{blog.title}</h3>
                                    <p className="text-gray-light text-sm">Autor: {blog.author}</p>
                                  </div>
                                </div>
                                <p className="text-gray-light mt-1">
                                  Fecha: {formatBlogDate(blog.createdAt || new Date())}
                                </p>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    blog.isPublished
                                      ? "bg-green-900/20 text-green-500 border border-green-500/30"
                                      : "bg-yellow-900/20 text-yellow-500 border border-yellow-500/30"
                                  }`}
                                >
                                  {blog.isPublished ? "Publicado" : "Borrador"}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 items-start">
                                <Link
                                  href={`/admin/blogs/${blog._id}/edit`}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-sm"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span>Editar</span>
                                </Link>
                                <button
                                  onClick={() => handleChangeBlogStatus(blog._id, !blog.isPublished)}
                                  className={`flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-500 rounded-md transition-colors text-sm`}
                                >
                                  {blog.isPublished ? "Despublicar" : "Publicar"}
                                </button>
                                <button
                                  onClick={() => {
                                    setBlogToDelete(blog)
                                    setIsBlogDeleteModalOpen(true)
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500 rounded-md transition-colors text-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                              <p className="text-gray-light mt-2">{blog.content.substring(0, 100)}...</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-dark-gray rounded-lg">
                          <FileText className="h-12 w-12 mx-auto text-gray-light mb-4" />
                          <h3 className="text-xl font-bold mb-2">No hay blogs</h3>
                          <p className="text-gray-light mb-6">No se encontraron blogs en el sistema.</p>
                          <Link
                            href="/admin/blogs/new"
                            className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors inline-flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Crear primer blog</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Gestión de Ponentes */}
              {activeTab === "speakers" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <span>Gestión de Ponentes</span>
                    </h2>
                    <Link
                      href="/admin/speakers/new"
                      className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Crear Ponente</span>
                    </Link>
                  </div>

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
                      <input
                        type="text"
                        placeholder="Buscar ponentes..."
                        className="w-full pl-10 pr-4 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        value={speakerSearchTerm}
                        onChange={(e) => setSpeakerSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      value={selectedSpeakerEventId}
                      onChange={(e) => setSelectedSpeakerEventId(e.target.value)}
                    >
                      <option value="all">Todos los eventos</option>
                      {events.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isLoadingSpeakers ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                      <p className="mt-4 text-gray-light">Cargando ponentes...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {speakers.length > 0 ? (
                        filteredSpeakers.map((speaker) => (
                          <div
                            key={speaker._id}
                            className="bg-dark-gray p-4 rounded-lg border border-transparent hover:border-gold/30 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row justify-between">
                              <div className="mb-4 sm:mb-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-burgundy" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg">{speaker.name}</h3>
                                    <p className="text-gray-light text-sm">
                                      {speaker.position} en {speaker.company}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 items-start">
                                <Link
                                  href={`/admin/speakers/${speaker._id}/edit`}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-sm"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span>Editar</span>
                                </Link>
                                <button
                                  onClick={() => {
                                    setSpeakerToDelete(speaker)
                                    setIsSpeakerDeleteModalOpen(true)
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500 rounded-md transition-colors text-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                              <p className="text-gray-light mt-2">{speaker.bio.substring(0, 100)}...</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-dark-gray rounded-lg">
                          <User className="h-12 w-12 mx-auto text-gray-light mb-4" />
                          <h3 className="text-xl font-bold mb-2">No hay ponentes</h3>
                          <p className="text-gray-light mb-6">No se encontraron ponentes en el sistema.</p>
                          <Link
                            href="/admin/speakers/new"
                            className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors inline-flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Crear primer ponente</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Gestión de Programas */}
              {activeTab === "programs" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <CalendarIcon className="h-6 w-6 text-burgundy" />
                      <span>Gestión de Programas</span>
                    </h2>
                  </div>

                  {/* Componente de gestión de programas */}
                  <EventProgramManager />
                </div>
              )}

              {/* Gestión de Exhibitors */}
              {activeTab === "exhibitors" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span>Gestión de Exhibitors</span>
                    </h2>
                    <Link
                      href="/admin/exhibitors/new"
                      className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Crear Opción de Stand</span>
                    </Link>
                  </div>

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
                      <input
                        type="text"
                        placeholder="Buscar opciones de stand..."
                        className="w-full pl-10 pr-4 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        value={standOptionSearchTerm}
                        onChange={(e) => setStandOptionSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      value={selectedEventForStandOptions}
                      onChange={(e) => setSelectedEventForStandOptions(e.target.value)}
                    >
                      <option value="all">Todos los eventos</option>
                      {events.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isLoadingStandOptions ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                      <p className="mt-4 text-gray-light">Cargando opciones de stand...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {standOptions.length > 0 ? (
                        filteredStandOptions.map((standOption) => (
                          <div
                            key={standOption._id}
                            className="bg-dark-gray p-4 rounded-lg border border-transparent hover:border-gold/30 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row justify-between">
                              <div className="mb-4 sm:mb-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-burgundy" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg">{standOption.title}</h3>
                                    <p className="text-gray-light text-sm">
                                      Evento: {getEventNameById(standOption.event)}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-gray-light mt-1">{standOption.description || "Sin descripción"}</p>
                                <div className="mt-2">
                                  <span className="px-2 py-1 text-xs rounded-full bg-blue-900/20 text-blue-400 border border-blue-500/30">
                                    {standOption.items.length} elementos de configuración
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 items-start">
                                <Link
                                  href={`/admin/exhibitors/${standOption._id}`}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-gold/50 hover:bg-gold/10 text-gold rounded-md transition-colors text-sm"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>Ver</span>
                                </Link>
                                <Link
                                  href={`/admin/exhibitors/${standOption._id}/edit`}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-sm"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span>Editar</span>
                                </Link>
                                <button
                                  onClick={() => {
                                    setStandOptionToDelete(standOption)
                                    setIsStandOptionDeleteModalOpen(true)
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500 rounded-md transition-colors text-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-dark-gray rounded-lg">
                          <Users className="h-12 w-12 mx-auto text-gray-light mb-4" />
                          <h3 className="text-xl font-bold mb-2">No hay opciones de stand</h3>
                          <p className="text-gray-light mb-6">No se encontraron opciones de stand en el sistema.</p>
                          <Link
                            href="/admin/exhibitors/new"
                            className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors inline-flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Crear primera opción de stand</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Gestión de Permisos de Exhibitors */}
              {activeTab === "exhibitor-permissions" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span>Permisos de Configuración para Exhibitors</span>
                    </h2>
                  </div>

                  <ExhibitorPermissionsTab />
                </div>
              )}

              {/* Gestión de Configuraciones de Stands */}
              {activeTab === "stand-configs" && (
                <div>
                  <StandConfigsTab />
                </div>
              )}

              {/* Gestión de Tipos de Tickets */}
              {activeTab === "ticket-types" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <TicketIcon className="h-5 w-5" />
                      <span>Gestión de Tipos de Tickets</span>
                    </h2>
                    <Link
                      href="/admin/ticket-types/new"
                      className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Crear Tipo de Ticket</span>
                    </Link>
                  </div>

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
                      <input
                        type="text"
                        placeholder="Buscar tipos de tickets..."
                        className="w-full pl-10 pr-4 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                        value={ticketTypeSearchTerm}
                        onChange={(e) => setTicketTypeSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                      value={selectedEventForTicketTypes}
                      onChange={(e) => setSelectedEventForTicketTypes(e.target.value)}
                    >
                      <option value="all">Todos los eventos</option>
                      {events.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isLoadingTicketTypes ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                      <p className="mt-4 text-gray-light">Cargando tipos de tickets...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ticketTypes.length > 0 ? (
                        filteredTicketTypes.map((ticketType) => (
                          <div
                            key={ticketType._id}
                            className="bg-dark-gray p-4 rounded-lg border border-transparent hover:border-gold/30 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row justify-between">
                              <div className="mb-4 sm:mb-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                                    <TicketIcon className="h-5 w-5 text-burgundy" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg">{ticketType.name}</h3>
                                    <p className="text-gray-light text-sm">Precio: {ticketType.price}€</p>
                                  </div>
                                </div>
                                <p className="text-gray-light mt-1">Evento: {getEventNameById(ticketType.eventId)}</p>
                              </div>
                              <div className="flex flex-wrap gap-2 items-start">
                                <Link
                                  href={`/admin/ticket-types/${ticketType._id}`}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-gold/50 hover:bg-gold/10 text-gold rounded-md transition-colors text-sm"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>Ver</span>
                                </Link>
                                <Link
                                  href={`/admin/ticket-types/${ticketType._id}/edit`}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-sm"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span>Editar</span>
                                </Link>
                                <button
                                  onClick={() => {
                                    setTicketTypeToDelete(ticketType)
                                    setIsTicketTypeDeleteModalOpen(true)
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500 rounded-md transition-colors text-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                              <p className="text-gray-light mt-2">
                                {ticketType.description?.substring(0, 100) || "Sin descripción"}...
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-dark-gray rounded-lg">
                          <TicketIcon className="h-12 w-12 mx-auto text-gray-light mb-4" />
                          <h3 className="text-xl font-bold mb-2">No hay tipos de tickets</h3>
                          <p className="text-gray-light mb-6">No se encontraron tipos de tickets en el sistema.</p>
                          <Link
                            href="/admin/ticket-types/new"
                            className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors inline-flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Crear primer tipo de ticket</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modales de confirmación de eliminación */}
      {/* Modal de confirmación para eliminar usuario */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center">
          <div className="bg-dark-gray rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-light mb-6">
              ¿Estás seguro de que quieres eliminar al usuario "
              <span className="text-gold">{userToDelete?.username}</span>"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-md text-gray-light hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-700 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar evento */}
      {isEventDeleteModalOpen && (
        <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center">
          <div className="bg-dark-gray rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-light mb-6">
              ¿Estás seguro de que quieres eliminar el evento "<span className="text-gold">{eventToDelete?.title}</span>
              "? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsEventDeleteModalOpen(false)}
                className="px-4 py-2 rounded-md text-gray-light hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteEvent}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-700 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar webinar */}
      {isWebinarDeleteModalOpen && (
        <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center">
          <div className="bg-dark-gray rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-light mb-6">
              ¿Estás seguro de que quieres eliminar el webinar "
              <span className="text-gold">{webinarToDelete?.title}</span>"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsWebinarDeleteModalOpen(false)}
                className="px-4 py-2 rounded-md text-gray-light hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteWebinar}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-700 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar ticket */}
      {isTicketDeleteModalOpen && (
        <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center">
          <div className="bg-dark-gray rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-light mb-6">
              ¿Estás seguro de que quieres eliminar el ticket "<span className="text-gold">{ticketToDelete?._id}</span>
              "? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsTicketDeleteModalOpen(false)}
                className="px-4 py-2 rounded-md text-gray-light hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTicket}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-700 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar blog */}
      {isBlogDeleteModalOpen && (
        <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center">
          <div className="bg-dark-gray rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-light mb-6">
              ¿Estás seguro de que quieres eliminar el blog "<span className="text-gold">{blogToDelete?.title}</span>"?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsBlogDeleteModalOpen(false)}
                className="px-4 py-2 rounded-md text-gray-light hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteBlog}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-700 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar speaker */}
      {isSpeakerDeleteModalOpen && (
        <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center">
          <div className="bg-dark-gray rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-light mb-6">
              ¿Estás seguro de que quieres eliminar al ponente "
              <span className="text-gold">{speakerToDelete?.name}</span>"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsSpeakerDeleteModalOpen(false)}
                className="px-4 py-2 rounded-md text-gray-light hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSpeaker}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-700 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar tipo de ticket */}
      {isTicketTypeDeleteModalOpen && (
        <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center">
          <div className="bg-dark-gray rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-light mb-6">
              ¿Estás seguro de que quieres eliminar el tipo de ticket "
              <span className="text-gold">{ticketTypeToDelete?.name}</span>"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsTicketTypeDeleteModalOpen(false)}
                className="px-4 py-2 rounded-md text-gray-light hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTicketType}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-700 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar opción de stand */}
      {isStandOptionDeleteModalOpen && (
        <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center">
          <div className="bg-dark-gray rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Confirmar Eliminación</h2>
            <p className="text-gray-light mb-6">
              ¿Estás seguro de que quieres eliminar la opción de stand "
              <span className="text-gold">{standOptionToDelete?.title}</span>"? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsStandOptionDeleteModalOpen(false)}
                className="px-4 py-2 rounded-md text-gray-light hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteStandOption}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-700 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
