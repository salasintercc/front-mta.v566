"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Navbar from "@/components/navbar"
import { get } from "@/utils/api"
import { getAllEvents, deleteEvent } from "@/services/event-service"
import type { Event } from "@/services/event-service"
import { getAllWebinars, deleteWebinar, formatWebinarDate } from "@/services/webinar-service"
import type { Webinar } from "@/services/webinar-service"
import { getAllTickets, deleteTicket, type Ticket } from "@/services/ticket-service"
import { getAllBlogs, deleteBlog, updateBlogStatus, type Blog } from "@/services/blog-service"
import { getAllSpeakers, deleteSpeaker, type Speaker } from "@/services/speaker-service"
import { getAllTicketTypes, deleteTicketType, type TicketType } from "@/services/ticket-type-service"
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
import {
  Calendar,
  MapPin,
  Edit,
  Trash2,
  LinkIcon,
  Plus,
  User,
  Eye,
  UserX,
  UserPlus,
  TicketIcon,
  Star,
  FileText,
  BarChart3,
  Users,
  CalendarIcon,
  Video,
} from "lucide-react"

// Importar componentes estandarizados
import DashboardCard from "@/components/admin/dashboard-card"
import DashboardSearch from "@/components/admin/dashboard-search"
import DashboardSelect from "@/components/admin/dashboard-select"
import DashboardButton from "@/components/admin/dashboard-button"
import DashboardSectionTitle from "@/components/admin/dashboard-section-title"
import DashboardEmptyState from "@/components/admin/dashboard-empty-state"
import DashboardLoading from "@/components/admin/dashboard-loading"
import DashboardPagination from "@/components/admin/dashboard-pagination"
import DashboardTab from "@/components/admin/dashboard-tab"
import DashboardModal from "@/components/admin/dashboard-modal"
import DashboardBadge from "@/components/admin/dashboard-badge"

// Importar el servicio de configuración
import { useSettings } from "@/services/settings-service"
import type { Settings } from "@/services/settings-service"

// Importar el componente SettingsTab
import SettingsTab from "./settings-tab"

// Importar el componente EventProgramManager
import EventProgramManager from "@/components/event-program-manager"

import {
  getAllStandOptions,
  getStandOptionsByEvent,
  deleteStandOption,
  type StandOption,
} from "@/services/stand-option-service"

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend)

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
  const [webinarToDelete, setWebinarToDelete] = useState<Webinar | null>(null)
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

  // Estados para tipos de tickets
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [isLoadingTicketTypes, setIsLoadingTicketTypes] = useState(true)
  const [ticketTypeToDelete, setTicketTypeToDelete] = useState<TicketType | null>(null)
  const [isTicketTypeDeleteModalOpen, setIsTicketTypeDeleteModalOpen] = useState(false)
  const [ticketTypeSearchTerm, setTicketTypeSearchTerm] = useState("")
  const [selectedEventForTicketTypes, setSelectedEventForTicketTypes] = useState<string | "all">("all")

  // Estado para el filtro de eventos destacados
  const [eventFeaturedFilter, setEventFeaturedFilter] = useState<string>("all")

  // Estados para opciones de stand de exhibitors
  const [standOptions, setStandOptions] = useState<StandOption[]>([])
  const [isLoadingStandOptions, setIsLoadingStandOptions] = useState(true)
  const [standOptionToDelete, setStandOptionToDelete] = useState<StandOption | null>(null)
  const [isStandOptionDeleteModalOpen, setIsStandOptionDeleteModalOpen] = useState(false)
  const [standOptionSearchTerm, setStandOptionSearchTerm] = useState("")
  const [selectedEventForStandOptions, setSelectedEventForStandOptions] = useState<string | "all">("all")

  // Hook de configuración
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

  // Nuevo estado para estadísticas de webinars
  const [webinarStats, setWebinarStats] = useState({
    total: 0,
    upcoming: 0,
    past: 0,
    mostPopular: "",
  })

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
      ].includes(tabParam) &&
      tabParam !== activeTab
    ) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Resto del código de la página...
  // (Mantener toda la lógica existente, solo cambiar la parte visual)

  const filteredUsers = users.filter((user) => {
    const searchTermLower = searchTerm.toLowerCase()
    const roleFilterLower = roleFilter.toLowerCase()

    const matchesSearchTerm =
      user.username.toLowerCase().includes(searchTermLower) || user.email.toLowerCase().includes(searchTermLower)

    const matchesRoleFilter = roleFilter === "" || user.role.toLowerCase() === roleFilterLower

    return matchesSearchTerm && matchesRoleFilter
  })

  const filteredEvents = events.filter((event) => {
    const searchTermLower = searchTerm.toLowerCase()
    const eventFeaturedFilterLower = eventFeaturedFilter.toLowerCase()

    const matchesSearchTerm = event.title.toLowerCase().includes(searchTermLower)

    let matchesFeaturedFilter = true

    if (eventFeaturedFilter !== "all") {
      if (eventFeaturedFilter === "featured") {
        matchesFeaturedFilter = event.isFeatured === true
      } else if (eventFeaturedFilter === "notFeatured") {
        matchesFeaturedFilter = event.isFeatured === false
      }
    }

    return matchesSearchTerm && matchesFeaturedFilter
  })

  const filteredTickets = tickets.filter((ticket) => {
    const searchTermLower = ticketSearchTerm.toLowerCase()
    const selectedEventId = selectedTicketEventId

    const matchesSearchTerm =
      ticket.username.toLowerCase().includes(searchTermLower) ||
      ticket.eventTitle.toLowerCase().includes(searchTermLower)

    const matchesEventFilter = selectedEventId === "all" || ticket.eventId === selectedEventId

    return matchesSearchTerm && matchesEventFilter
  })

  const filteredBlogs = blogs.filter((blog) => {
    const searchTermLower = blogSearchTerm.toLowerCase()
    const blogStatusFilterLower = blogStatusFilter.toLowerCase()

    const matchesSearchTerm = blog.title.toLowerCase().includes(searchTermLower)

    const matchesStatusFilter =
      blogStatusFilter === "" ||
      (blogStatusFilter === "published" && blog.isPublished) ||
      (blogStatusFilter === "draft" && !blog.isPublished)

    return matchesSearchTerm && matchesStatusFilter
  })

  const filteredSpeakers = speakers.filter((speaker) => {
    const searchTermLower = speakerSearchTerm.toLowerCase()
    const selectedEventId = selectedSpeakerEventId

    const matchesSearchTerm = speaker.name.toLowerCase().includes(searchTermLower)

    const matchesEventFilter = selectedEventId === "all" || speaker.events?.includes(selectedEventId)

    return matchesSearchTerm && matchesEventFilter
  })

  const filteredTicketTypes = ticketTypes.filter((ticketType) => {
    const searchTermLower = ticketTypeSearchTerm.toLowerCase()
    const selectedEventId = selectedEventForTicketTypes

    const matchesSearchTerm = ticketType.name.toLowerCase().includes(searchTermLower)

    const matchesEventFilter = selectedEventId === "all" || ticketType.eventId === selectedEventId

    return matchesSearchTerm && matchesEventFilter
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

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return date.toLocaleDateString("es-ES", options)
  }

  function formatBlogDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return date.toLocaleDateString("es-ES", options)
  }

  const handleDeleteUser = async () => {
    if (userToDelete) {
      try {
        setIsDeleteModalOpen(false)
        setIsLoading(true)
        const response = await fetch(`/api/users/${userToDelete.id || userToDelete._id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Error al eliminar el usuario")
        }

        setUsers((prevUsers) =>
          prevUsers.filter((user) => (user.id || user._id) !== (userToDelete.id || userToDelete._id)),
        )
        setSuccessMessage("Usuario eliminado correctamente.")
      } catch (error: any) {
        setError(error.message || "Error al eliminar el usuario.")
      } finally {
        setIsLoading(false)
        setUserToDelete(null)
      }
    }
  }

  const handleDeleteEvent = async () => {
    if (eventToDelete) {
      try {
        setIsEventDeleteModalOpen(false)
        setIsLoading(true)
        const response = await deleteEvent(eventToDelete._id)

        if (response.status !== 200) {
          throw new Error("Error al eliminar el evento")
        }

        setEvents((prevEvents) => prevEvents.filter((event) => event._id !== eventToDelete._id))
        setSuccessMessage("Evento eliminado correctamente.")
      } catch (error: any) {
        setError(error.message || "Error al eliminar el evento.")
      } finally {
        setIsLoading(false)
        setEventToDelete(null)
      }
    }
  }

  const handleDeleteWebinar = async () => {
    if (webinarToDelete) {
      try {
        setIsWebinarDeleteModalOpen(false)
        setIsLoading(true)
        const response = await deleteWebinar(webinarToDelete._id)

        if (response.status !== 200) {
          throw new Error("Error al eliminar el webinar")
        }

        setWebinars((prevWebinars) => prevWebinars.filter((webinar) => webinar._id !== webinarToDelete._id))
        setSuccessMessage("Webinar eliminado correctamente.")
      } catch (error: any) {
        setError(error.message || "Error al eliminar el webinar.")
      } finally {
        setIsLoading(false)
        setWebinarToDelete(null)
      }
    }
  }

  const handleDeleteTicket = async () => {
    if (ticketToDelete) {
      try {
        setIsTicketDeleteModalOpen(false)
        setIsLoadingTickets(true)
        const response = await deleteTicket(ticketToDelete._id)

        if (response.status !== 200) {
          throw new Error("Error al eliminar el ticket")
        }

        setTickets((prevTickets) => prevTickets.filter((ticket) => ticket._id !== ticketToDelete._id))
        setSuccessMessage("Ticket eliminado correctamente.")
      } catch (error: any) {
        setError(error.message || "Error al eliminar el ticket.")
      } finally {
        setIsLoadingTickets(false)
        setTicketToDelete(null)
      }
    }
  }

  const handleDeleteBlog = async () => {
    if (blogToDelete) {
      try {
        setIsBlogDeleteModalOpen(false)
        setIsLoadingBlogs(true)
        const response = await deleteBlog(blogToDelete._id)

        if (response.status !== 200) {
          throw new Error("Error al eliminar el blog")
        }

        setBlogs((prevBlogs) => prevBlogs.filter((blog) => blog._id !== blogToDelete._id))
        setSuccessMessage("Blog eliminado correctamente.")
      } catch (error: any) {
        setError(error.message || "Error al eliminar el blog.")
      } finally {
        setIsLoadingBlogs(false)
        setBlogToDelete(null)
      }
    }
  }

  const handleChangeBlogStatus = async (blogId: string, newStatus: boolean) => {
    try {
      setIsLoadingBlogs(true)
      const response = await updateBlogStatus(blogId, newStatus)

      if (response.status !== 200) {
        throw new Error("Error al actualizar el estado del blog")
      }

      setBlogs((prevBlogs) =>
        prevBlogs.map((blog) => (blog._id === blogId ? { ...blog, isPublished: newStatus } : blog)),
      )
      setSuccessMessage("Estado del blog actualizado correctamente.")
    } catch (error: any) {
      setError(error.message || "Error al actualizar el estado del blog.")
    } finally {
      setIsLoadingBlogs(false)
    }
  }

  const handleDeleteSpeaker = async () => {
    if (speakerToDelete) {
      try {
        setIsSpeakerDeleteModalOpen(false)
        setIsLoadingSpeakers(true)
        const response = await deleteSpeaker(speakerToDelete._id)

        if (response.status !== 200) {
          throw new Error("Error al eliminar el speaker")
        }

        setSpeakers((prevSpeakers) => prevSpeakers.filter((speaker) => speaker._id !== speakerToDelete._id))
        setSuccessMessage("Speaker eliminado correctamente.")
      } catch (error: any) {
        setError(error.message || "Error al eliminar el speaker.")
      } finally {
        setIsLoadingSpeakers(false)
        setSpeakerToDelete(null)
      }
    }
  }

  const handleDeleteTicketType = async () => {
    if (ticketTypeToDelete) {
      try {
        setIsTicketTypeDeleteModalOpen(false)
        setIsLoadingTicketTypes(true)
        const response = await deleteTicketType(ticketTypeToDelete._id)

        if (response.status !== 200) {
          throw new Error("Error al eliminar el tipo de ticket")
        }

        setTicketTypes((prevTicketTypes) =>
          prevTicketTypes.filter((ticketType) => ticketType._id !== ticketTypeToDelete._id),
        )
        setSuccessMessage("Tipo de ticket eliminado correctamente.")
      } catch (error: any) {
        setError(error.message || "Error al eliminar el tipo de ticket.")
      } finally {
        setIsLoadingTicketTypes(false)
        setTicketTypeToDelete(null)
      }
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

  const loadStatistics = async () => {
    setStatsLoading(true)
    try {
      // Cargar estadísticas de usuarios
      const userStatsResponse = await get("/api/admin/stats/users")
      if (userStatsResponse.status === 200) {
        setUserStats(userStatsResponse.data)
      } else {
        console.error("Error al cargar estadísticas de usuarios:", userStatsResponse.error)
      }

      // Cargar estadísticas de eventos
      const eventStatsResponse = await get("/api/admin/stats/events")
      if (eventStatsResponse.status === 200) {
        setEventStats(eventStatsResponse.data)
      } else {
        console.error("Error al cargar estadísticas de eventos:", eventStatsResponse.error)
      }

      // Cargar estadísticas de tickets
      const ticketStatsResponse = await get("/api/admin/stats/tickets")
      if (ticketStatsResponse.status === 200) {
        setTicketStats(ticketStatsResponse.data)
      } else {
        console.error("Error al cargar estadísticas de tickets:", ticketStatsResponse.error)
      }

      // Cargar estadísticas de blogs
      const blogStatsResponse = await get("/api/admin/stats/blogs")
      if (blogStatsResponse.status === 200) {
        setBlogStats(blogStatsResponse.data)
      } else {
        console.error("Error al cargar estadísticas de blogs:", blogStatsResponse.error)
      }

      // Cargar estadísticas de webinars
      const webinarStatsResponse = await get("/api/admin/stats/webinars")
      if (webinarStatsResponse.status === 200) {
        setWebinarStats(webinarStatsResponse.data)
      } else {
        console.error("Error al cargar estadísticas de webinars:", webinarStatsResponse.error)
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  const getEventNameById = (eventId: string): string => {
    const event = events.find((event) => event._id === eventId)
    return event ? event.title : "Evento no encontrado"
  }

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const eventsResponse = await getAllEvents()
      if (eventsResponse.status === 200) {
        setEvents(eventsResponse.data)
      } else {
        setError(eventsResponse.error || "Error al cargar eventos")
      }
    } catch (error: any) {
      setError(error.message || "Error al cargar eventos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setIsLoadingTickets(true)
        setIsLoadingBlogs(true)
        setIsLoadingSpeakers(true)
        setIsLoadingTicketTypes(true)

        // Obtener usuarios
        const usersResponse = await get("/api/users")
        if (usersResponse.status === 200) {
          setUsers(usersResponse.data)
        } else {
          setError(usersResponse.error || "Error al cargar usuarios")
        }

        // Obtener eventos
        const eventsResponse = await getAllEvents()
        if (eventsResponse.status === 200) {
          setEvents(eventsResponse.data)
        } else {
          setError(eventsResponse.error || "Error al cargar eventos")
        }

        // Obtener webinars
        const webinarsResponse = await getAllWebinars()
        if (webinarsResponse.status === 200) {
          setWebinars(webinarsResponse.data)
        } else {
          setError(webinarsResponse.error || "Error al cargar webinars")
        }

        // Obtener tickets
        const ticketsResponse = await getAllTickets()
        if (ticketsResponse.status === 200) {
          setTickets(ticketsResponse.data)
        } else {
          setError(ticketsResponse.error || "Error al cargar tickets")
        }

        // Obtener blogs
        const blogsResponse = await getAllBlogs()
        if (blogsResponse.status === 200) {
          setBlogs(blogsResponse.data)
        } else {
          setError(blogsResponse.error || "Error al cargar blogs")
        }

        // Obtener speakers
        const speakersResponse = await getAllSpeakers()
        if (speakersResponse.status === 200) {
          setSpeakers(speakersResponse.data)
        } else {
          setError(speakersResponse.error || "Error al cargar speakers")
        }

        // Obtener ticket types
        const ticketTypesResponse = await getAllTicketTypes()
        if (ticketTypesResponse.status === 200) {
          setTicketTypes(ticketTypesResponse.data)
        } else {
          setError(ticketTypesResponse.error || "Error al cargar tipos de tickets")
        }

        // Cargar estadísticas
        await loadStatistics()
      } catch (error: any) {
        setError(error.message || "Error al cargar datos")
      } finally {
        setIsLoading(false)
        setIsLoadingTickets(false)
        setIsLoadingBlogs(false)
        setIsLoadingSpeakers(false)
        setIsLoadingTicketTypes(false)
      }
    }

    fetchData()
  }, [])

  // Efecto para cargar las opciones de stand cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === "exhibitors") {
      fetchEvents()
      fetchStandOptions()
    }
  }, [activeTab, selectedEventForStandOptions])

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
                <DashboardTab
                  label="Gestión de Usuarios"
                  value="users"
                  activeTab={activeTab}
                  icon={<Users />}
                  baseUrl="/admin/dashboard"
                />
                <DashboardTab
                  label="Gestión de Eventos"
                  value="events"
                  activeTab={activeTab}
                  icon={<CalendarIcon />}
                  baseUrl="/admin/dashboard"
                />
                <DashboardTab
                  label="Gestión de Webinars"
                  value="webinars"
                  activeTab={activeTab}
                  icon={<Video />}
                  baseUrl="/admin/dashboard"
                />
                <DashboardTab
                  label="Gestión de Tickets"
                  value="tickets"
                  activeTab={activeTab}
                  icon={<TicketIcon />}
                  baseUrl="/admin/dashboard"
                />
                <DashboardTab
                  label="Gestión de Blogs"
                  value="blogs"
                  activeTab={activeTab}
                  icon={<FileText />}
                  baseUrl="/admin/dashboard"
                />
                <DashboardTab
                  label="Gestión de Ponentes"
                  value="speakers"
                  activeTab={activeTab}
                  icon={<User />}
                  baseUrl="/admin/dashboard"
                />
                <DashboardTab
                  label="Gestión de Programas"
                  value="programs"
                  activeTab={activeTab}
                  icon={<Calendar />}
                  baseUrl="/admin/dashboard"
                />
                <DashboardTab
                  label="Gestión de Exhibitors"
                  value="exhibitors"
                  activeTab={activeTab}
                  icon={<Users />}
                  baseUrl="/admin/dashboard"
                />
                <DashboardTab
                  label="Gestión Precio Tickets"
                  value="ticket-types"
                  activeTab={activeTab}
                  icon={<TicketIcon />}
                  baseUrl="/admin/dashboard"
                />
                <DashboardTab
                  label="Estadísticas"
                  value="stats"
                  activeTab={activeTab}
                  icon={<BarChart3 />}
                  baseUrl="/admin/dashboard"
                />
                <DashboardTab
                  label="Configuración"
                  value="settings"
                  activeTab={activeTab}
                  icon={<Settings />}
                  baseUrl="/admin/dashboard"
                />
              </nav>
            </div>

            {/* Contenido principal */}
            <div className="md:col-span-3 bg-dark-gray p-6 rounded-lg">
              {/* Gestión de Usuarios */}
              {activeTab === "users" && (
                <div>
                  <DashboardSectionTitle
                    title="Gestión de Usuarios"
                    icon={<Users />}
                    actions={
                      <DashboardButton
                        href="/admin/users/new"
                        variant="primary"
                        icon={<UserPlus className="h-4 w-4" />}
                      >
                        Crear Usuario
                      </DashboardButton>
                    }
                  />

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <DashboardSearch
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <DashboardSelect
                      options={[
                        { value: "", label: "Todos los roles" },
                        { value: "admin", label: "Administradores" },
                        { value: "user", label: "Usuarios" },
                      ]}
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    />
                  </div>

                  {isLoading ? (
                    <DashboardLoading message="Cargando usuarios..." />
                  ) : (
                    <div className="bg-rich-black rounded-lg overflow-hidden">
                      {filteredUsers.length > 0 ? (
                        <div className="grid gap-4">
                          {filteredUsers.map((user) => (
                            <DashboardCard key={user.id || user._id}>
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
                                    <DashboardBadge variant={user.isActive ? "success" : "danger"}>
                                      {user.isActive ? "Activo" : "Inactivo"}
                                    </DashboardBadge>
                                    <DashboardBadge variant="gold" className="capitalize">
                                      {user.role}
                                    </DashboardBadge>
                                    {user.cargo && <DashboardBadge>{user.cargo}</DashboardBadge>}
                                    {user.empresa && <DashboardBadge>{user.empresa}</DashboardBadge>}
                                    {user.paisResidencia && <DashboardBadge>{user.paisResidencia}</DashboardBadge>}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 items-start">
                                  <DashboardButton
                                    href={`/admin/users/${user.id || user._id}`}
                                    variant="secondary"
                                    size="sm"
                                    icon={<Eye className="h-4 w-4" />}
                                  >
                                    Ver
                                  </DashboardButton>
                                  <DashboardButton
                                    href={`/admin/users/${user.id || user._id}/edit`}
                                    variant="info"
                                    size="sm"
                                    icon={<Edit className="h-4 w-4" />}
                                  >
                                    Editar
                                  </DashboardButton>
                                  <DashboardButton
                                    onClick={() => {
                                      setUserToDelete(user)
                                      setIsDeleteModalOpen(true)
                                    }}
                                    variant="danger"
                                    size="sm"
                                    icon={<Trash2 className="h-4 w-4" />}
                                  >
                                    Eliminar
                                  </DashboardButton>
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
                            </DashboardCard>
                          ))}
                        </div>
                      ) : (
                        <DashboardEmptyState
                          icon={<UserX className="h-12 w-12" />}
                          title="No hay usuarios"
                          description="No se encontraron usuarios en el sistema."
                          action={
                            <DashboardButton
                              href="/admin/users/new"
                              variant="primary"
                              icon={<UserPlus className="h-4 w-4" />}
                            >
                              Crear primer usuario
                            </DashboardButton>
                          }
                        />
                      )}
                    </div>
                  )}

                  {/* Paginación */}
                  {filteredUsers.length > 0 && (
                    <DashboardPagination
                      currentPage={1}
                      totalPages={1}
                      onPageChange={() => {}}
                      itemCount={filteredUsers.length}
                      itemName="usuarios"
                    />
                  )}
                </div>
              )}

              {/* Gestión de Eventos */}
              {activeTab === "events" && (
                <div>
                  <DashboardSectionTitle
                    title="Gestión de Eventos"
                    icon={<CalendarIcon />}
                    actions={
                      <DashboardButton href="/admin/events/new" variant="primary" icon={<Plus className="h-4 w-4" />}>
                        Crear Evento
                      </DashboardButton>
                    }
                  />

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <DashboardSearch
                      placeholder="Buscar eventos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <DashboardSelect
                      options={[
                        { value: "all", label: "Todos los eventos" },
                        { value: "featured", label: "Destacados" },
                        { value: "notFeatured", label: "No destacados" },
                      ]}
                      value={eventFeaturedFilter}
                      onChange={(e) => setEventFeaturedFilter(e.target.value)}
                    />
                  </div>

                  {isLoading ? (
                    <DashboardLoading message="Cargando eventos..." />
                  ) : (
                    <div className="space-y-4">
                      {events.length > 0 ? (
                        filteredEvents.map((event) => (
                          <DashboardCard key={event._id}>
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
                                    <DashboardBadge variant="gold" icon={<Star className="h-3 w-3 mr-1" />}>
                                      Destacado
                                    </DashboardBadge>
                                  )}
                                  <DashboardBadge variant="info" icon={<Calendar className="h-3 w-3 mr-1" />}>
                                    {formatDate(event.date)}
                                  </DashboardBadge>
                                </div>

                                <p className="text-gray-light mt-3 text-sm line-clamp-2">{event.description}</p>
                              </div>

                              <div className="flex flex-wrap gap-2 items-start">
                                <DashboardButton
                                  href={`/admin/events/${event._id}`}
                                  variant="secondary"
                                  size="sm"
                                  icon={<Eye className="h-4 w-4" />}
                                >
                                  Ver
                                </DashboardButton>
                                <DashboardButton
                                  href={`/admin/events/${event._id}/edit`}
                                  variant="info"
                                  size="sm"
                                  icon={<Edit className="h-4 w-4" />}
                                >
                                  Editar
                                </DashboardButton>
                                <DashboardButton
                                  onClick={() => {
                                    setEventToDelete(event)
                                    setIsEventDeleteModalOpen(true)
                                  }}
                                  variant="danger"
                                  size="sm"
                                  icon={<Trash2 className="h-4 w-4" />}
                                >
                                  Eliminar
                                </DashboardButton>
                              </div>
                            </div>
                          </DashboardCard>
                        ))
                      ) : (
                        <DashboardEmptyState
                          icon={<CalendarIcon className="h-12 w-12" />}
                          title="No hay eventos"
                          description="No se encontraron eventos en el sistema."
                          action={
                            <DashboardButton
                              href="/admin/events/new"
                              variant="primary"
                              icon={<Plus className="h-4 w-4" />}
                            >
                              Crear primer evento
                            </DashboardButton>
                          }
                        />
                      )}
                    </div>
                  )}

                  {/* Paginación */}
                  {filteredEvents.length > 0 && (
                    <DashboardPagination
                      currentPage={1}
                      totalPages={1}
                      onPageChange={() => {}}
                      itemCount={filteredEvents.length}
                      itemName="eventos"
                    />
                  )}
                </div>
              )}

              {/* Gestión de Webinars */}
              {activeTab === "webinars" && (
                <div>
                  <DashboardSectionTitle
                    title="Gestión de Webinars"
                    icon={<Video />}
                    actions={
                      <DashboardButton href="/admin/webinars/new" variant="primary" icon={<Plus className="h-4 w-4" />}>
                        Crear Webinar
                      </DashboardButton>
                    }
                  />

                  {/* Barra de búsqueda */}
                  <div className="mb-6">
                    <DashboardSearch
                      placeholder="Buscar webinars..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {isLoading ? (
                    <DashboardLoading message="Cargando webinars..." />
                  ) : (
                    <div className="space-y-4">
                      {webinars.length > 0 ? (
                        webinars.map((webinar) => (
                          <DashboardCard key={webinar._id}>
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
                                  <DashboardBadge variant="info" icon={<LinkIcon className="h-3 w-3 mr-1" />}>
                                    <a
                                      href={webinar.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      Enlace al webinar
                                    </a>
                                  </DashboardBadge>
                                </div>

                                <p className="text-gray-light mt-3 text-sm line-clamp-2">{webinar.description}</p>
                              </div>

                              <div className="flex flex-wrap gap-2 items-start">
                                <DashboardButton
                                  href={`/admin/webinars/${webinar._id}`}
                                  variant="secondary"
                                  size="sm"
                                  icon={<Eye className="h-4 w-4" />}
                                >
                                  Ver
                                </DashboardButton>
                                <DashboardButton
                                  href={`/admin/webinars/${webinar._id}/edit`}
                                  variant="info"
                                  size="sm"
                                  icon={<Edit className="h-4 w-4" />}
                                >
                                  Editar
                                </DashboardButton>
                                <DashboardButton
                                  onClick={() => {
                                    setWebinarToDelete(webinar)
                                    setIsWebinarDeleteModalOpen(true)
                                  }}
                                  variant="danger"
                                  size="sm"
                                  icon={<Trash2 className="h-4 w-4" />}
                                >
                                  Eliminar
                                </DashboardButton>
                              </div>
                            </div>
                          </DashboardCard>
                        ))
                      ) : (
                        <DashboardEmptyState
                          icon={<Video className="h-12 w-12" />}
                          title="No hay webinars"
                          description="No se encontraron webinars en el sistema."
                          action={
                            <DashboardButton
                              href="/admin/webinars/new"
                              variant="primary"
                              icon={<Plus className="h-4 w-4" />}
                            >
                              Crear primer webinar
                            </DashboardButton>
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Gestión de Tickets */}
              {activeTab === "tickets" && (
                <div>
                  <DashboardSectionTitle title="Gestión de Tickets" icon={<TicketIcon />} />

                  {/* Desplegable para filtrar por evento */}
                  <div className="mb-4">
                    <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="eventFilter">
                      Filtrar por evento
                    </label>
                    <DashboardSelect
                      options={[
                        { value: "all", label: "Todos los tickets" },
                        ...events.map((event) => ({ value: event._id, label: event.title })),
                      ]}
                      value={selectedTicketEventId}
                      onChange={(e) => setSelectedTicketEventId(e.target.value)}
                    />
                  </div>

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6">
                    <DashboardSearch
                      placeholder="Buscar tickets..."
                      value={ticketSearchTerm}
                      onChange={(e) => setTicketSearchTerm(e.target.value)}
                    />
                  </div>

                  {isLoadingTickets ? (
                    <DashboardLoading message="Cargando tickets..." />
                  ) : (
                    <div className="bg-rich-black rounded-lg overflow-hidden">
                      {filteredTickets.length > 0 ? (
                        <div className="grid gap-4">
                          {filteredTickets.map((ticket) => (
                            <DashboardCard key={ticket._id}>
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
                                    <DashboardBadge variant={ticket.status === "reserved" ? "success" : "danger"}>
                                      {ticket.status === "reserved" ? "Reservado" : "Cancelado"}
                                    </DashboardBadge>
                                    <DashboardBadge>ID: {ticket._id.substring(0, 8)}...</DashboardBadge>
                                    <DashboardBadge>
                                      Creado: {new Date(ticket.createdAt).toLocaleDateString()}
                                    </DashboardBadge>
                                  </div>
                                </div>

                                <div className="flex justify-end">
                                  <DashboardButton
                                    onClick={() => {
                                      setTicketToDelete(ticket)
                                      setIsTicketDeleteModalOpen(true)
                                    }}
                                    variant="danger"
                                    size="sm"
                                    icon={<Trash2 className="h-4 w-4" />}
                                  >
                                    Eliminar
                                  </DashboardButton>
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
                            </DashboardCard>
                          ))}
                        </div>
                      ) : (
                        <DashboardEmptyState
                          icon={<TicketIcon className="h-12 w-12" />}
                          title="No hay tickets"
                          description="No se encontraron tickets en el sistema."
                        />
                      )}
                    </div>
                  )}

                  {/* Paginación */}
                  {filteredTickets.length > 0 && (
                    <DashboardPagination
                      currentPage={1}
                      totalPages={1}
                      onPageChange={() => {}}
                      itemCount={filteredTickets.length}
                      itemName="tickets"
                    />
                  )}
                </div>
              )}

              {/* Gestión de Blogs */}
              {activeTab === "blogs" && (
                <div>
                  <DashboardSectionTitle
                    title="Gestión de Blogs"
                    icon={<FileText />}
                    actions={
                      <DashboardButton href="/admin/blogs/new" variant="primary" icon={<Plus className="h-4 w-4" />}>
                        Crear Blog
                      </DashboardButton>
                    }
                  />

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <DashboardSearch
                      placeholder="Buscar blogs..."
                      value={blogSearchTerm}
                      onChange={(e) => setBlogSearchTerm(e.target.value)}
                    />
                    <DashboardSelect
                      options={[
                        { value: "", label: "Todos los estados" },
                        { value: "published", label: "Publicados" },
                        { value: "draft", label: "Borradores" },
                      ]}
                      value={blogStatusFilter}
                      onChange={(e) => setBlogStatusFilter(e.target.value)}
                    />
                  </div>

                  {isLoadingBlogs ? (
                    <DashboardLoading message="Cargando blogs..." />
                  ) : (
                    <div className="space-y-4">
                      {blogs.length > 0 ? (
                        filteredBlogs.map((blog) => (
                          <DashboardCard key={blog._id}>
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
                                <DashboardBadge variant={blog.isPublished ? "success" : "warning"}>
                                  {blog.isPublished ? "Publicado" : "Borrador"}
                                </DashboardBadge>
                              </div>
                              <div className="flex flex-wrap gap-2 items-start">
                                <DashboardButton
                                  href={`/admin/blogs/${blog._id}/edit`}
                                  variant="info"
                                  size="sm"
                                  icon={<Edit className="h-4 w-4" />}
                                >
                                  Editar
                                </DashboardButton>
                                <DashboardButton
                                  onClick={() => handleChangeBlogStatus(blog._id, !blog.isPublished)}
                                  variant="warning"
                                  size="sm"
                                >
                                  {blog.isPublished ? "Despublicar" : "Publicar"}
                                </DashboardButton>
                                <DashboardButton
                                  onClick={() => {
                                    setBlogToDelete(blog)
                                    setIsBlogDeleteModalOpen(true)
                                  }}
                                  variant="danger"
                                  size="sm"
                                  icon={<Trash2 className="h-4 w-4" />}
                                >
                                  Eliminar
                                </DashboardButton>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                              <p className="text-gray-light mt-2">{blog.content.substring(0, 100)}...</p>
                            </div>
                          </DashboardCard>
                        ))
                      ) : (
                        <DashboardEmptyState
                          icon={<FileText className="h-12 w-12" />}
                          title="No hay blogs"
                          description="No se encontraron blogs en el sistema."
                          action={
                            <DashboardButton
                              href="/admin/blogs/new"
                              variant="primary"
                              icon={<Plus className="h-4 w-4" />}
                            >
                              Crear primer blog
                            </DashboardButton>
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Gestión de Ponentes */}
              {activeTab === "speakers" && (
                <div>
                  <DashboardSectionTitle
                    title="Gestión de Ponentes"
                    icon={<User />}
                    actions={
                      <DashboardButton href="/admin/speakers/new" variant="primary" icon={<Plus className="h-4 w-4" />}>
                        Crear Ponente
                      </DashboardButton>
                    }
                  />

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <DashboardSearch
                      placeholder="Buscar ponentes..."
                      value={speakerSearchTerm}
                      onChange={(e) => setSpeakerSearchTerm(e.target.value)}
                    />
                    <DashboardSelect
                      options={[
                        { value: "all", label: "Todos los eventos" },
                        ...events.map((event) => ({ value: event._id, label: event.title })),
                      ]}
                      value={selectedSpeakerEventId}
                      onChange={(e) => setSelectedSpeakerEventId(e.target.value)}
                    />
                  </div>

                  {isLoadingSpeakers ? (
                    <DashboardLoading message="Cargando ponentes..." />
                  ) : (
                    <div className="space-y-4">
                      {speakers.length > 0 ? (
                        filteredSpeakers.map((speaker) => (
                          <DashboardCard key={speaker._id}>
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
                                <DashboardButton
                                  href={`/admin/speakers/${speaker._id}/edit`}
                                  variant="info"
                                  size="sm"
                                  icon={<Edit className="h-4 w-4" />}
                                >
                                  Editar
                                </DashboardButton>
                                <DashboardButton
                                  onClick={() => {
                                    setSpeakerToDelete(speaker)
                                    setIsSpeakerDeleteModalOpen(true)
                                  }}
                                  variant="danger"
                                  size="sm"
                                  icon={<Trash2 className="h-4 w-4" />}
                                >
                                  Eliminar
                                </DashboardButton>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                              <p className="text-gray-light mt-2">{speaker.bio.substring(0, 100)}...</p>
                            </div>
                          </DashboardCard>
                        ))
                      ) : (
                        <DashboardEmptyState
                          icon={<User className="h-12 w-12" />}
                          title="No hay ponentes"
                          description="No se encontraron ponentes en el sistema."
                          action={
                            <DashboardButton
                              href="/admin/speakers/new"
                              variant="primary"
                              icon={<Plus className="h-4 w-4" />}
                            >
                              Crear primer ponente
                            </DashboardButton>
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Gestión de Programas */}
              {activeTab === "programs" && (
                <div>
                  <DashboardSectionTitle title="Gestión de Programas" icon={<Calendar />} />

                  {/* Componente de gestión de programas */}
                  <EventProgramManager />
                </div>
              )}

              {/* Gestión de Exhibitors */}
              {activeTab === "exhibitors" && (
                <div>
                  <DashboardSectionTitle
                    title="Gestión de Exhibitors"
                    icon={<Users />}
                    actions={
                      <DashboardButton
                        href="/admin/exhibitors/new"
                        variant="primary"
                        icon={<Plus className="h-4 w-4" />}
                      >
                        Crear Opción de Stand
                      </DashboardButton>
                    }
                  />

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <DashboardSearch
                      placeholder="Buscar opciones de stand..."
                      value={standOptionSearchTerm}
                      onChange={(e) => setStandOptionSearchTerm(e.target.value)}
                    />
                    <DashboardSelect
                      options={[
                        { value: "all", label: "Todos los eventos" },
                        ...events.map((event) => ({ value: event._id, label: event.title })),
                      ]}
                      value={selectedEventForStandOptions}
                      onChange={(e) => setSelectedEventForStandOptions(e.target.value)}
                    />
                  </div>

                  {isLoadingStandOptions ? (
                    <DashboardLoading message="Cargando opciones de stand..." />
                  ) : (
                    <div className="space-y-4">
                      {standOptions.length > 0 ? (
                        filteredStandOptions.map((standOption) => (
                          <DashboardCard key={standOption._id}>
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
                                  <DashboardBadge variant="info">
                                    {standOption.items.length} elementos de configuración
                                  </DashboardBadge>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 items-start">
                                <DashboardButton
                                  href={`/admin/exhibitors/${standOption._id}`}
                                  variant="secondary"
                                  size="sm"
                                  icon={<Eye className="h-4 w-4" />}
                                >
                                  Ver
                                </DashboardButton>
                                <DashboardButton
                                  href={`/admin/exhibitors/${standOption._id}/edit`}
                                  variant="info"
                                  size="sm"
                                  icon={<Edit className="h-4 w-4" />}
                                >
                                  Editar
                                </DashboardButton>
                                <DashboardButton
                                  onClick={() => {
                                    setStandOptionToDelete(standOption)
                                    setIsStandOptionDeleteModalOpen(true)
                                  }}
                                  variant="danger"
                                  size="sm"
                                  icon={<Trash2 className="h-4 w-4" />}
                                >
                                  Eliminar
                                </DashboardButton>
                              </div>
                            </div>
                          </DashboardCard>
                        ))
                      ) : (
                        <DashboardEmptyState
                          icon={<Users className="h-12 w-12" />}
                          title="No hay opciones de stand"
                          description="No se encontraron opciones de stand en el sistema."
                          action={
                            <DashboardButton
                              href="/admin/exhibitors/new"
                              variant="primary"
                              icon={<Plus className="h-4 w-4" />}
                            >
                              Crear primera opción de stand
                            </DashboardButton>
                          }
                        />
                      )}
                    </div>
                  )}

                  {/* Paginación */}
                  {filteredStandOptions.length > 0 && (
                    <DashboardPagination
                      currentPage={1}
                      totalPages={1}
                      onPageChange={() => {}}
                      itemCount={filteredStandOptions.length}
                      itemName="opciones de stand"
                    />
                  )}
                </div>
              )}

              {/* Gestión de Tipos de Tickets */}
              {activeTab === "ticket-types" && (
                <div>
                  <DashboardSectionTitle
                    title="Gestión de Tipos de Tickets"
                    icon={<TicketIcon />}
                    actions={
                      <DashboardButton
                        href="/admin/ticket-types/new"
                        variant="primary"
                        icon={<Plus className="h-4 w-4" />}
                      >
                        Crear Tipo de Ticket
                      </DashboardButton>
                    }
                  />

                  {/* Barra de búsqueda y filtros */}
                  <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <DashboardSearch
                      placeholder="Buscar tipos de tickets..."
                      value={ticketTypeSearchTerm}
                      onChange={(e) => setTicketTypeSearchTerm(e.target.value)}
                    />
                    <DashboardSelect
                      options={[
                        { value: "all", label: "Todos los eventos" },
                        ...events.map((event) => ({ value: event._id, label: event.title })),
                      ]}
                      value={selectedEventForTicketTypes}
                      onChange={(e) => setSelectedEventForTicketTypes(e.target.value)}
                    />
                  </div>

                  {isLoadingTicketTypes ? (
                    <DashboardLoading message="Cargando tipos de tickets..." />
                  ) : (
                    <div className="space-y-4">
                      {ticketTypes.length > 0 ? (
                        filteredTicketTypes.map((ticketType) => (
                          <DashboardCard key={ticketType._id}>
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
                                <DashboardButton
                                  href={`/admin/ticket-types/${ticketType._id}`}
                                  variant="secondary"
                                  size="sm"
                                  icon={<Eye className="h-4 w-4" />}
                                >
                                  Ver
                                </DashboardButton>
                                <DashboardButton
                                  href={`/admin/ticket-types/${ticketType._id}/edit`}
                                  variant="info"
                                  size="sm"
                                  icon={<Edit className="h-4 w-4" />}
                                >
                                  Editar
                                </DashboardButton>
                                <DashboardButton
                                  onClick={() => {
                                    setTicketTypeToDelete(ticketType)
                                    setIsTicketTypeDeleteModalOpen(true)
                                  }}
                                  variant="danger"
                                  size="sm"
                                  icon={<Trash2 className="h-4 w-4" />}
                                >
                                  Eliminar
                                </DashboardButton>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-700/50">
                              <p className="text-gray-light mt-2">
                                {ticketType.description?.substring(0, 100) || "Sin descripción"}...
                              </p>
                            </div>
                          </DashboardCard>
                        ))
                      ) : (
                        <DashboardEmptyState
                          icon={<TicketIcon className="h-12 w-12" />}
                          title="No hay tipos de tickets"
                          description="No se encontraron tipos de tickets en el sistema."
                          action={
                            <DashboardButton
                              href="/admin/ticket-types/new"
                              variant="primary"
                              icon={<Plus className="h-4 w-4" />}
                            >
                              Crear primer tipo de ticket
                            </DashboardButton>
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Estadísticas */}
              {activeTab === "stats" && (
                <div>
                  <DashboardSectionTitle title="Estadísticas" icon={<BarChart3 />} />

                  {statsLoading ? (
                    <DashboardLoading message="Cargando estadísticas..." />
                  ) : (
                    <div className="space-y-8">
                      {/* Resumen general */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <DashboardCard>
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
                        </DashboardCard>

                        <DashboardCard>
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
                        </DashboardCard>

                        <DashboardCard>
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
                        </DashboardCard>

                        <DashboardCard>
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
                        </DashboardCard>

                        <DashboardCard>
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
                        </DashboardCard>
                      </div>

                      {/* Gráficos y estadísticas detalladas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Resto de los gráficos y estadísticas... */}
                      </div>

                      {/* Botones de acción */}
                      <div className="flex flex-wrap gap-4 justify-end mt-8">
                        <DashboardButton onClick={() => loadStatistics()} variant="primary">
                          Recargar Estadísticas
                        </DashboardButton>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Configuración */}
              {activeTab === "settings" && <SettingsTab />}
            </div>
          </div>
        </div>
      </section>

      {/* Modales de confirmación */}
      <DashboardModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        footer={
          <div className="flex justify-end gap-4">
            <DashboardButton onClick={() => setIsDeleteModalOpen(false)} variant="secondary">
              Cancelar
            </DashboardButton>
            <DashboardButton onClick={handleDeleteUser} variant="danger">
              Eliminar
            </DashboardButton>
          </div>
        }
      >
        <p className="text-gray-light">
          ¿Estás seguro de que quieres eliminar al usuario "<span className="text-gold">{userToDelete?.username}</span>
          "? Esta acción no se puede deshacer.
        </p>
      </DashboardModal>

      {/* Otros modales de confirmación... */}
      {/* Modal de confirmación para eliminar opción de stand */}
      <DashboardModal
        isOpen={isStandOptionDeleteModalOpen}
        onClose={() => setIsStandOptionDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        footer={
          <div className="flex justify-end gap-4">
            <DashboardButton onClick={() => setIsStandOptionDeleteModalOpen(false)} variant="secondary">
              Cancelar
            </DashboardButton>
            <DashboardButton onClick={handleDeleteStandOption} variant="danger">
              Eliminar
            </DashboardButton>
          </div>
        }
      >
        <p className="text-gray-light">
          ¿Estás seguro de que quieres eliminar la opción de stand "
          <span className="text-gold">{standOptionToDelete?.title}</span>"? Esta acción no se puede deshacer.
        </p>
      </DashboardModal>
    </main>
  )
}
