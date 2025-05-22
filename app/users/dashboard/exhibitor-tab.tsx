"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getAllStandOptions } from "@/services/stand-option-service"
import { getUserConfig, saveConfig, downloadConfigAsPdf } from "@/services/stand-config-service"
import { getEnabledEventsForExhibitor } from "@/services/event-exhibitor-config-service"
import StandConfigurationWizard from "@/components/exhibitor/stand-configuration-wizard"
import {
  Settings,
  Check,
  AlertCircle,
  ChevronRight,
  Info,
  Calendar,
  Lock,
  Bug,
  RefreshCw,
  ChevronDown,
  Shield,
  ListChecks,
  FileText,
  Download,
  CreditCard,
} from "lucide-react"
import { get } from "@/utils/api"
import {
  StandConfig,
  StandOption,
  StandItem,
  StandOptionItem,
  StandConfigurationData,
  StandConfigurationState,
} from "@/types/stand"

interface ExhibitorTabProps {
  userId: string
}

export default function ExhibitorTab({ userId }: ExhibitorTabProps) {
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [standOptions, setStandOptions] = useState<StandOption[]>([])
  const [standConfigs, setStandConfigs] = useState<StandConfig[]>([])
  const [showWizard, setShowWizard] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [rawApiResponse, setRawApiResponse] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [jwtPayload, setJwtPayload] = useState<any>(null)
  const [initialConfigs, setInitialConfigs] = useState<Record<string, StandConfigurationData>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [standOptionsCache, setStandOptionsCache] = useState<Record<string, StandOption>>({})
  const [isPdfLoading, setIsPdfLoading] = useState<Record<string, boolean>>({})
  const [tokenRefreshed, setTokenRefreshed] = useState(false)
  const [selectedItems, setSelectedItems] = useState<StandConfigurationState>({})

  // Función para decodificar el token JWT
  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      return JSON.parse(jsonPayload)
    } catch (e) {
      console.error("Error decodificando JWT:", e)
      return null
    }
  }

  // Fetch events and user's stand configurations
  useEffect(() => {
    // Check if token exists and is valid
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const payload = decodeJwt(token)
        if (payload) {
          const currentTime = Math.floor(Date.now() / 1000)
          if (payload.exp && payload.exp < currentTime) {
            // Token has expired, try to refresh
            console.log("Token has expired, refreshing...")
            refreshToken()
          } else {
            // Token is valid, fetch data
            fetchData()
          }
        } else {
          // Invalid token, try to refresh
          console.log("Invalid token, refreshing...")
          refreshToken()
        }
      } catch (e) {
        console.error("Error checking token:", e)
        setError("Error checking authentication token. Please try logging in again.")
        setIsLoading(false)
      }
    } else {
      // No token, show error
      setError("No authentication token found. Please log in.")
      setIsLoading(false)
    }
  }, [user, tokenRefreshed])

  // Function to refresh the token
  const refreshToken = async () => {
    try {
      console.log("Attempting to refresh token...")

      // Try to get a new token from the auth context or API
      // This is a placeholder - you need to implement the actual token refresh logic
      // based on your authentication system

      // For now, we'll just set an error
      setError("Your session has expired. Please log in again.")
      setIsLoading(false)

      // If you implement token refresh, you would set tokenRefreshed to true
      // setTokenRefreshed(true)
    } catch (err) {
      console.error("Error refreshing token:", err)
      setError("Failed to refresh your session. Please log in again.")
      setIsLoading(false)
    }
  }

  // Update the fetchData function to use the userId prop
  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setWarning(null)
      setDebugInfo(null)
      setRawApiResponse(null)
      setJwtPayload(null)

      if (!user) {
        setError("User information not available. Please log in again.")
        setIsLoading(false)
        return
      }

      // Use the userId prop instead of extracting from user object
      if (!userId) {
        throw new Error("User ID not found")
      }

      console.log("Fetching data for user:", userId)
      console.log("User role:", user.role, "User type:", user.userType)

      // Verificar si el usuario es un exhibitor según el role o userType
      const isExhibitor = user.role === "exhibitor" || user.userType === "exhibitor"

      if (!isExhibitor) {
        setWarning("Tu cuenta no tiene el rol de exhibitor. Contacta al administrador.")
        setIsLoading(false)
        setEvents([])
        return
      }

      // Decodificar el token JWT para diagnóstico
      const token = localStorage.getItem("token")
      if (token) {
        const payload = decodeJwt(token)
        setJwtPayload(payload)
        console.log("JWT Payload:", payload)

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < currentTime) {
          console.log("Token has expired during fetch")
          setError("Your session has expired. Please log in again.")
          setIsLoading(false)
          return
        }
      } else {
        console.log("No token found in localStorage")
        setError("No authentication token found. Please log in.")
        setIsLoading(false)
        return
      }

      // Obtener todos los eventos para referencia
      try {
        const eventsData = await get<any[]>(`/events`)
        setAllEvents(eventsData || [])
        console.log(`Se obtuvieron ${eventsData.length} eventos en total`)
      } catch (err: any) {
        console.error("Error obteniendo todos los eventos:", err)
        if (err.message.includes("Unauthorized")) {
          setError("Session expired or invalid. Please log in again.")
          setIsLoading(false)
          return
        }
      }

      // Obtener la respuesta directa del API para depuración
      try {
        // Enviar el ID del usuario explícitamente como parámetro de consulta
        const rawResponse = await get(`/event-exhibitor-config/user?userId=${userId}`)
        setRawApiResponse(rawResponse)
        console.log("Respuesta directa del API:", rawResponse)
      } catch (err: any) {
        console.error("Error obteniendo respuesta directa:", err)
        if (err.message.includes("Unauthorized")) {
          setError("Session expired or invalid. Please log in again.")
          setIsLoading(false)
          return
        }
      }

      // Fetch only enabled events for this exhibitor
      console.log("Obteniendo eventos habilitados...")
      try {
        const enabledEvents = await getEnabledEventsForExhibitor()
        console.log("Eventos disponibles para el exhibitor:", enabledEvents)

        // Guardar información de depuración
        setDebugInfo(
          JSON.stringify(
            {
              user: {
                id: userId,
                role: user.role,
                userType: user.userType,
              },
              jwtPayload: jwtPayload,
              enabledEvents: enabledEvents,
              rawApiResponse: rawApiResponse,
              allEvents: allEvents.map((e) => ({ _id: e._id, title: e.title })),
            },
            null,
            2,
          ),
        )

        if (!enabledEvents || enabledEvents.length === 0) {
          setWarning(
            "No tienes eventos habilitados para configurar tu stand. Contacta al administrador para solicitar acceso.",
          )
          setIsLoading(false)
          setEvents([])
          return
        }

        setEvents(enabledEvents)

        // Si hay eventos, seleccionar el primero por defecto
        if (enabledEvents.length > 0) {
          setSelectedEvent(enabledEvents[0]._id)
        }
      } catch (err: any) {
        console.error("Error fetching enabled events:", err)
        if (err.message.includes("Unauthorized")) {
          setError("Session expired or invalid. Please log in again.")
        } else {
          setError(`Error fetching enabled events: ${err.message}`)
        }
        setIsLoading(false)
        return
      }

      // Fetch all stand options
      try {
        const allOptions = await getAllStandOptions()
        console.log("Todas las opciones de stand:", allOptions)

        // Cache all stand options for later use
        const optionsCache: Record<string, StandOption> = {}
        allOptions.forEach((option) => {
          optionsCache[option._id] = option
        })
        setStandOptionsCache(optionsCache)

        // Try to get configurations for each stand option
        const userConfigs: StandConfig[] = []
        const initialConfigsObj: Record<string, StandConfigurationData> = {}

        for (const option of allOptions) {
          // This will return null if no config exists (404 error)
          const config = await getUserConfig(option._id)
          if (config) {
            userConfigs.push({
              ...config,
              standOption: option,
            })

            // Store the configuration for this option - handle both old and new structure
            initialConfigsObj[option._id] = {
              configData: config.configData || {},
              totalPrice: config.totalPrice || 0,
              priceBreakdown: config.priceBreakdown || {},
              isSubmitted: config.isSubmitted || false,
              paymentStatus: config.paymentStatus || "pending"
            }
          }
        }

        console.log("Configuraciones del usuario:", userConfigs)
        setStandConfigs(userConfigs)
        setInitialConfigs(initialConfigsObj)

        if (userConfigs.length === 0) {
          setWarning((prev) =>
            prev
              ? `${prev}\n\nNo se encontraron configuraciones de stand. Puedes configurar tu stand a continuación.`
              : "No se encontraron configuraciones de stand. Puedes configurar tu stand a continuación.",
          )
        }
      } catch (err: any) {
        console.error("Error fetching stand options or configurations:", err)
        if (err.message.includes("Unauthorized")) {
          setError("Session expired or invalid. Please log in again.")
        } else {
          setError(`Error fetching stand options or configurations: ${err.message}`)
        }
      }
    } catch (err: any) {
      console.error("Error fetching exhibitor data:", err)
      setError(
        `Error al cargar los datos del exhibitor: ${err.message || "Error desconocido"}. Por favor, inténtalo de nuevo más tarde.`,
      )

      // Guardar información de depuración del error
      setDebugInfo(
        JSON.stringify(
          {
            error: err.message || "Error desconocido",
            user: user
              ? {
                  id: user._id || user.id,
                  role: user.role,
                  userType: user.userType,
                }
              : "No user data",
            jwtPayload: jwtPayload,
            rawApiResponse: rawApiResponse,
          },
          null,
          2,
        ),
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Función para refrescar los datos
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  // Fetch stand options when selected event changes
  useEffect(() => {
    const fetchStandOptions = async () => {
      if (!selectedEvent) {
        // This is not an error, just no event selected yet
        setStandOptions([])
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        console.log("Fetching stand options for event:", selectedEvent)

        // Fetch all stand options
        const allOptions = await getAllStandOptions()
        console.log("All stand options:", allOptions)

        // Filter options for the selected event
        const eventOptions = allOptions.filter((option) => option.event === selectedEvent)
        console.log("Stand options for selected event:", eventOptions)

        setStandOptions(eventOptions)

        if (eventOptions.length === 0) {
          setWarning((prev) =>
            prev
              ? `${prev}\n\nNo hay opciones de stand disponibles para este evento.`
              : "No hay opciones de stand disponibles para este evento.",
          )
        }
      } catch (err: any) {
        console.error("Error fetching stand options:", err)
        if (err.message.includes("Unauthorized")) {
          setError("Session expired or invalid. Please log in again.")
        } else {
          setError(`Error al cargar las opciones de stand: ${err.message}`)
        }
        setStandOptions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchStandOptions()
  }, [selectedEvent])

  // Handle event selection change
  const handleEventChange = (eventId: string) => {
    setSelectedEvent(eventId)
    setShowWizard(false)
  }

  // Handle stand option selection
  const handleStartConfiguration = () => {
    if (!selectedEvent) return

    try {
      // Verificar si el usuario tiene permisos para configurar este evento
      const event = events.find((e) => e._id === selectedEvent)

      // Si el evento no tiene isStandConfigEnabled o no es true, no permitimos configurar
      if (!event || (event.isStandConfigEnabled !== undefined && !event.isStandConfigEnabled)) {
        setError("No tienes permisos para configurar stands en este evento. Contacta al administrador.")
        return
      }

      // Show the wizard with all stand options for this event
      setShowWizard(true)
    } catch (err) {
      console.error("Error starting configuration:", err)
    }
  }

  // Update the handleWizardComplete function to return the configurations
  const handleWizardComplete = async (configurations: Record<string, StandConfigurationData>) => {
    if (!user || !selectedEvent) return configurations

    try {
      setIsLoading(true)
      setError(null)

      console.log("Saving configurations:", configurations)

      // Save each configuration
      const savedConfigs: StandConfig[] = []

      for (const [standOptionId, config] of Object.entries(configurations)) {
        // Format the configuration data according to what the backend expects
        const configData = {
          event: selectedEvent,
          configData: config.configData,
          totalPrice: config.totalPrice || 0,
          priceBreakdown: config.priceBreakdown || {},
          isSubmitted: config.isSubmitted || true,
          paymentStatus: config.paymentStatus || "pending",
        }

        // Save the configuration
        const savedConfig = await saveConfig(standOptionId, configData)

        if (savedConfig) {
          savedConfigs.push({
            ...savedConfig,
            standOption: standOptions.find((option) => option._id === standOptionId) || standOptionId,
          })
        }
      }

      console.log("Saved configurations:", savedConfigs)

      // Update the local state with the new configurations
      if (savedConfigs.length > 0) {
        setStandConfigs(savedConfigs)
      }

      // Close wizard
      setShowWizard(false)

      // Return the configurations as required by the type
      return configurations
    } catch (err: any) {
      console.error("Error saving stand configurations:", err)
      if (err.message.includes("Unauthorized")) {
        setError("Session expired or invalid. Please log in again.")
      } else {
        setError(`Error al guardar las configuraciones: ${err.message}`)
      }
      // Return the original configurations even in case of error
      return configurations
    } finally {
      setIsLoading(false)
    }
  }

  // Function to get human-readable label for a field
  const getFieldLabel = (standOption: StandOption, fieldId: string) => {
    if (!standOption || !standOption.items) return fieldId

    const item = standOption.items.find((item: StandItem) => item._id === fieldId)
    return item ? item.label : fieldId
  }

  // Function to get human-readable option label
  const getOptionLabel = (standOption: StandOption, fieldId: string, optionId: string) => {
    if (!standOption || !standOption.items) return optionId

    const item = standOption.items.find((item: StandItem) => item._id === fieldId)
    if (!item || !item.options) return optionId

    const option = item.options.find((opt: StandOptionItem) => opt._id === optionId)
    return option ? option.label : optionId
  }

  // Function to get payment status badge color
  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  // Function to download configuration as PDF
  const handleDownloadPdf = async (config: StandConfig) => {
    try {
      // Necesitamos el ID de la configuración, no el ID de la opción de stand
      const configId = config._id

      if (!configId) {
        throw new Error("ID de configuración no encontrado")
      }

      // Set loading state for this specific config
      setIsPdfLoading((prev) => ({ ...prev, [configId]: true }))

      // Mostrar información sobre la configuración de la API
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      console.log("API Base URL:", apiBaseUrl)
      console.log("Descargando PDF para configuración:", configId)

      // Verificar que la URL de la API sea correcta
      if (!apiBaseUrl || apiBaseUrl === "") {
        setWarning(
          "La variable de entorno NEXT_PUBLIC_API_URL no está configurada. Usando URL por defecto: http://localhost:4000",
        )
      }

      await downloadConfigAsPdf(configId)

      setSuccessMessage("PDF descargado correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error downloading PDF:", err)
      if (err.message.includes("Unauthorized")) {
        setError("Session expired or invalid. Please log in again.")
      } else {
        setError(
          `Error al descargar el PDF: ${err.message}. Asegúrate de que la URL de la API (${
            process.env.NEXT_PUBLIC_API_URL || ""
          }) apunte a tu servidor de API backend, no a tu aplicación Next.js.`,
        )
      }
    } finally {
      // Clear loading state for this specific config
      const configId = config._id
      if (configId) {
        setIsPdfLoading((prev) => ({ ...prev, [configId]: false }))
      }
    }
  }

  // Function to export all configurations for an exhibitor
  const handleExportAllConfigurations = () => {
    try {
      // Filter configurations for the selected event
      const eventConfigs = standConfigs.filter((config) => {
        return config.event === selectedEvent
      })

      if (eventConfigs.length === 0) {
        setWarning("No hay configuraciones para exportar para este evento.")
        return
      }

      // Get event details
      const eventDetails = events.find((e) => e._id === selectedEvent)

      // Calculate grand total across all configurations
      let grandTotal = 0

      // Format the data for export in a human-readable format
      const exportData = {
        exhibitor: {
          id: user?._id || user?.id,
          email: user?.email,
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          company: user?.empresa || "",
        },
        event: {
          id: eventDetails?._id,
          name: eventDetails?.title,
          date: eventDetails?.date,
        },
        exportDate: new Date().toISOString(),
        configurations: eventConfigs.map((config) => {
          // Get stand option details
          const standOptionId = typeof config.standOption === "string" ? config.standOption : config.standOption?._id
          const standOption = standOptionsCache[standOptionId] || config.standOption

          // Get configuration data
          const configData = config.configData || {}

          // Get total price and price breakdown
          const totalPrice = config.totalPrice || 0
          const priceBreakdown = config.priceBreakdown || {}

          // Add to grand total
          grandTotal += totalPrice

          // Process configuration items to be human-readable
          const processedItems = []

          // Process each configuration item
          if (standOption && standOption.items) {
            for (const item of standOption.items) {
              const itemId = item._id
              if (!itemId || configData[itemId] === undefined) continue

              const value = configData[itemId]
              const processedItem = {
                label: item.label,
                description: item.description || "No description available",
                type: item.type,
                response: null as any,
              }

              // Format the response based on the type
              if (item.type === "text") {
                processedItem.response = value || "No response"
              } else if (item.type === "upload") {
                processedItem.response = value ? { type: "file", url: value } : "No file uploaded"
              } else if (item.type === "select" || item.type === "image") {
                if (Array.isArray(value)) {
                  // Multiple selections
                  processedItem.response = value.map((optionId) => {
                    const option = item.options?.find((o) => o._id === optionId)
                    return option
                      ? {
                          id: optionId,
                          label: option.label,
                          price: option.price,
                          description: option.description,
                        }
                      : { id: optionId, label: "Unknown option" }
                  })
                } else if (value) {
                  // Single selection
                  const option = item.options?.find((o) => o._id === value)
                  processedItem.response = option
                    ? {
                        id: value,
                        label: option.label,
                        price: option.price,
                        description: option.description,
                      }
                    : { id: value, label: "Unknown option" }
                } else {
                  processedItem.response = "No option selected"
                }
              }

              processedItems.push(processedItem)
            }
          } else {
            // If we don't have stand option details, try to make the best of what we have
            Object.entries(configData).forEach(([key, value]) => {
              if (key === "_metadata") return

              processedItems.push({
                label: key,
                description: "No description available",
                type: "unknown",
                response: value,
              })
            })
          }

          return {
            type: {
              id: standOptionId,
              title: typeof standOption === "string" ? standOption : standOption?.title || "Unknown",
            },
            isSubmitted: config.isSubmitted,
            isPaid: config.isPaid || false,
            paymentStatus: config.paymentStatus || "pending",
            lastUpdated: config.updatedAt || "Unknown",
            totalPrice: totalPrice,
            priceBreakdown: priceBreakdown,
            items: processedItems,
          }
        }),
        grandTotal: grandTotal,
      }

      // Create a blob and download link
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `stand-configurations-${eventDetails?.title || selectedEvent}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccessMessage("Configuraciones exportadas correctamente en formato legible")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error exporting configurations:", err)
      setError(`Error al exportar las configuraciones: ${err.message}`)
    }
  }

  // Function to export a single configuration
  const handleExportSingleConfig = (config: StandConfig) => {
    try {
      const standOptionId = typeof config.standOption === "string" ? config.standOption : config.standOption?._id

      // Get stand option details from cache or from the config
      const standOption =
        standOptionsCache[standOptionId] || (typeof config.standOption === "string" ? null : config.standOption)

      // Get event details
      const eventId = typeof config.event === "string" ? config.event : config.event?._id
      const eventObj = events.find((e) => e._id === eventId)
      const eventName = eventObj
        ? eventObj.title
        : typeof config.event === "string"
          ? config.event
          : config.event?.title || eventId

      // Get configuration data
      const configData = config.configData || {}

      // Get total price and price breakdown
      const totalPrice = config.totalPrice || 0
      const priceBreakdown = config.priceBreakdown || {}

      // Process configuration items to be human-readable
      const processedItems = []

      // Process each configuration item
      if (standOption && standOption.items) {
        for (const item of standOption.items) {
          const itemId = item._id
          if (!itemId || configData[itemId] === undefined) continue

          const value = configData[itemId]
          const processedItem = {
            label: item.label,
            description: item.description || "No description available",
            type: item.type,
            response: null as any,
          }

          // Format the response based on the type
          if (item.type === "text") {
            processedItem.response = value || "No response"
          } else if (item.type === "upload") {
            processedItem.response = value ? { type: "file", url: value } : "No file uploaded"
          } else if (item.type === "select" || item.type === "image") {
            if (Array.isArray(value)) {
              // Multiple selections
              processedItem.response = value.map((optionId) => {
                const option = item.options?.find((o) => o._id === optionId)
                return option
                  ? {
                      id: optionId,
                      label: option.label,
                      price: option.price,
                      description: option.description,
                    }
                  : { id: optionId, label: "Unknown option" }
              })
            } else if (value) {
              // Single selection
              const option = item.options?.find((o) => o._id === value)
              processedItem.response = option
                ? {
                    id: value,
                    label: option.label,
                    price: option.price,
                    description: option.description,
                  }
                : { id: value, label: "Unknown option" }
            } else {
              processedItem.response = "No option selected"
            }
          }

          processedItems.push(processedItem)
        }
      } else {
        // If we don't have stand option details, try to make the best of what we have
        Object.entries(configData).forEach(([key, value]) => {
          if (key === "_metadata") return

          processedItems.push({
            label: key,
            description: "No description available",
            type: "unknown",
            response: value,
          })
        })
      }

      // Create an object with the data to export
      const exportData = {
        exhibitor: {
          id: user?._id || user?.id,
          email: user?.email,
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
          company: user?.empresa || "",
        },
        event: {
          id: eventId,
          name: eventName,
        },
        standOption: {
          id: standOptionId,
          title: typeof standOption === "string" ? standOption : standOption?.title || "Unknown",
        },
        isSubmitted: config.isSubmitted,
        isPaid: config.isPaid || false,
        paymentStatus: config.paymentStatus || "pending",
        submittedAt: config.updatedAt || "Unknown",
        totalPrice: totalPrice,
        priceBreakdown: priceBreakdown,
        items: processedItems,
      }

      // Convert to JSON
      const jsonString = JSON.stringify(exportData, null, 2)

      // Create a blob and download link
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      // Get stand option title for filename
      const optionTitle =
        typeof standOption === "string" ? standOption : standOption?.title || `config-${standOptionId.substring(0, 8)}`

      // Create a link and click it to download
      const a = document.createElement("a")
      a.href = url
      a.download = `${optionTitle.replace(/\s+/g, "-").toLowerCase()}-config.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccessMessage("Configuración exportada correctamente en formato legible")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error exporting configuration:", err)
      setError(`Error al exportar la configuración: ${err.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div
          className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-burgundy border-r-transparent align-[-0.125em]"
          role="status"
        >
          <span className="sr-only">Cargando...</span>
        </div>
        <h3 className="mt-6 text-lg font-medium text-gray-800">Cargando información del exhibitor</h3>
        <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
          Estamos recuperando tus configuraciones y eventos disponibles. Esto puede tardar un momento.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Ha ocurrido un error</h3>
              <p className="mt-2 text-red-700">{error}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-burgundy text-white rounded-md hover:bg-burgundy/90 transition-colors focus:outline-none focus:ring-2 focus:ring-burgundy focus:ring-offset-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refrescando..." : "Refrescar datos"}
          </button>

          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <Bug className="h-4 w-4" />
            {showDebugInfo ? "Ocultar información técnica" : "Mostrar información técnica"}
          </button>
        </div>

        {showDebugInfo && debugInfo && (
          <div className="bg-gray-900 text-gray-300 p-4 rounded-md overflow-auto max-h-96 border border-gray-700">
            <pre className="text-xs font-mono">{debugInfo}</pre>
          </div>
        )}
      </div>
    )
  }

  // If wizard is shown, render it
  if (showWizard && selectedEvent) {
    // Find the event to get its title
    const event = events.find((e) => e._id === selectedEvent)
    const eventTitle = event?.title || "Event Configuration"

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <button
          onClick={() => setShowWizard(false)}
          className="mb-6 text-burgundy hover:text-burgundy/80 inline-flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-burgundy focus:ring-offset-2 rounded-md px-3 py-1.5"
        >
          <ChevronRight className="h-5 w-5 rotate-180" />
          <span>Volver a las opciones</span>
        </button>

        <StandConfigurationWizard
          standOptions={standOptions}
          initialConfigs={initialConfigs}
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
          eventTitle={eventTitle}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Panel de Exhibitor</h2>
          <p className="text-gray-600 mt-1">Configura tus stands para los eventos habilitados</p>
        </div>

        <div className="flex gap-2">
          {standConfigs.length > 0 && selectedEvent && (
            <button
              onClick={handleExportAllConfigurations}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-burgundy rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-burgundy focus:ring-offset-2"
              aria-label="Exportar todas las configuraciones"
            >
              <Download className="h-4 w-4" />
              <span>Exportar Todo</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-burgundy rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-burgundy focus:ring-offset-2"
            disabled={isRefreshing}
            aria-label="Refrescar datos"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refrescando..." : "Refrescar datos"}</span>
          </button>
        </div>
      </div>

      {warning && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-md mb-8">
          <div className="flex items-start">
            <Info className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-amber-800">Información importante</h3>
              <div className="mt-2 text-amber-700 whitespace-pre-line">{warning}</div>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-5 rounded-md mb-8">
          <div className="flex items-start">
            <Check className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-green-800">Éxito</h3>
              <div className="mt-2 text-green-700 whitespace-pre-line">{successMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de diagnóstico */}
      <div className="bg-blue-50 border border-blue-100 p-5 rounded-lg mb-8">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-blue-800">Información de cuenta</h3>
            <div className="mt-3 space-y-2">
              <p className="text-blue-700 flex items-center gap-2">
                <span className="font-medium">Usuario:</span>
                <span>{user?.email}</span>
              </p>
              <p className="text-blue-700 flex items-center gap-2">
                <span className="font-medium">ID:</span>
                <span className="text-sm font-mono bg-blue-100 px-2 py-0.5 rounded">{user?._id || user?.id}</span>
              </p>
              <p className="text-blue-700 flex items-center gap-2">
                <span className="font-medium">Rol:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user?.role || "No definido"}
                </span>
              </p>
              <p className="text-blue-700 flex items-center gap-2">
                <span className="font-medium">Eventos habilitados:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {events.length}
                </span>
              </p>
            </div>

            <div className="mt-4">
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="inline-flex items-center gap-2 text-blue-700 text-sm hover:text-blue-800 focus:outline-none focus:underline"
              >
                <Bug className="h-4 w-4" />
                {showDebugInfo ? "Ocultar detalles técnicos" : "Mostrar detalles técnicos"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Información de depuración */}
      {showDebugInfo && debugInfo && (
        <div className="bg-gray-900 text-gray-300 p-4 rounded-md overflow-auto max-h-96 mb-8 border border-gray-700">
          <div className="flex justify-between items-center mb-2 text-gray-400 border-b border-gray-700 pb-2">
            <span className="font-mono text-xs">Información de diagnóstico</span>
            <button
              onClick={() => setShowDebugInfo(false)}
              className="text-gray-400 hover:text-white"
              aria-label="Cerrar información de diagnóstico"
            >
              ×
            </button>
          </div>
          <pre className="text-xs font-mono">{debugInfo}</pre>
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes eventos habilitados</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            No tienes eventos habilitados para configurar tu stand. Contacta al administrador para solicitar acceso.
          </p>
        </div>
      ) : (
        <>
          {/* Event selection */}
          <div className="mb-8">
            <label htmlFor="event-select" className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona un Evento
            </label>
            <div className="relative">
              <select
                id="event-select"
                className="block w-full pl-3 pr-10 py-2.5 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-burgundy focus:border-burgundy rounded-md appearance-none bg-white"
                value={selectedEvent || ""}
                onChange={(e) => handleEventChange(e.target.value)}
                aria-label="Seleccionar evento"
              >
                <option value="" className="text-gray-900">
                  Selecciona un evento
                </option>
                {events.map((event) => {
                  // Verificar si el evento tiene el campo isStandConfigEnabled
                  const isConfigEnabled =
                    event.isStandConfigEnabled === undefined || event.isStandConfigEnabled === true

                  return (
                    <option
                      key={event._id}
                      value={event._id}
                      disabled={!isConfigEnabled}
                      className={!isConfigEnabled ? "text-gray-400" : "text-gray-900"}
                    >
                      {event.title} {!isConfigEnabled ? "(Configuración no habilitada)" : ""}
                    </option>
                  )
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-800">
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Stand options */}
          {selectedEvent && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Opciones de Stand Disponibles</h3>
                <span className="text-sm text-gray-500">
                  {standOptions.length} {standOptions.length === 1 ? "opción" : "opciones"} disponibles
                </span>
              </div>

              {/* Verificar si el evento seleccionado tiene configuración habilitada */}
              {(() => {
                const selectedEventData = events.find((e) => e._id === selectedEvent)
                const isConfigEnabled =
                  selectedEventData?.isStandConfigEnabled === undefined ||
                  selectedEventData?.isStandConfigEnabled === true

                if (!isConfigEnabled) {
                  return (
                    <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-md mb-6">
                      <div className="flex items-start">
                        <Lock className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-lg font-medium text-red-800">Configuración no habilitada</h3>
                          <p className="mt-2 text-red-700">
                            No tienes permisos para configurar stands en este evento. Contacta al administrador para
                            solicitar acceso.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }

                return null
              })()}

              {standOptions.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-md text-center">
                  <p className="text-gray-600">No hay opciones de stand disponibles para este evento.</p>
                </div>
              ) : (
                <div className="mb-8">
                  {/* Configure all stand options button */}
                  <div className="bg-burgundy/5 border border-burgundy/20 rounded-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-1">Configuración completa de stand</h4>
                        <p className="text-gray-600">
                          Configura todas las opciones de stand para este evento en un solo proceso
                        </p>
                      </div>
                      <button
                        onClick={handleStartConfiguration}
                        className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-3 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <ListChecks className="h-5 w-5" />
                        <span>Configurar Todo</span>
                      </button>
                    </div>
                  </div>

                  {/* Individual stand options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {standOptions.map((option) => {
                      // Check if user has already configured this option
                      const existingConfig = standConfigs.find((config) => {
                        const configOptionId =
                          typeof config.standOption === "string" ? config.standOption : config.standOption?._id

                        return configOptionId === option._id && config.event === selectedEvent
                      })

                      // Verificar si el evento seleccionado tiene configuración habilitada
                      const selectedEventData = events.find((e) => e._id === selectedEvent)
                      const isConfigEnabled =
                        selectedEventData?.isStandConfigEnabled === undefined ||
                        selectedEventData?.isStandConfigEnabled === true

                      return (
                        <div
                          key={option._id}
                          className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="text-lg font-semibold text-gray-800">{option.title}</h4>
                              {existingConfig && existingConfig.isSubmitted && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Check className="h-3 w-3 mr-1" />
                                  Configurado
                                </span>
                              )}
                            </div>

                            {option.description && (
                              <p className="text-gray-600 mb-4 line-clamp-2">{option.description}</p>
                            )}

                            <div className="flex items-center text-sm text-gray-500 mb-5">
                              <span className="inline-flex items-center mr-4">
                                <Settings className="h-4 w-4 mr-1 text-gray-400" />
                                {option.items?.length || 0} pasos
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing configurations */}
          {standConfigs.length > 0 && (
            <div className="mt-12">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Tus Configuraciones de Stand</h3>

                {/* Export button for all configurations */}
                {selectedEvent && (
                  <button
                    onClick={handleExportAllConfigurations}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 text-burgundy rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-burgundy focus:ring-offset-2 text-sm"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Ver Todas las Configuraciones</span>
                  </button>
                )}
              </div>

              <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Evento
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Configuración
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {standConfigs.map((config) => {
                      // Find the corresponding event
                      const event = events.find((e) => e._id === config.event)

                      // Get stand option title
                      let optionTitle = "Configuración Desconocida"
                      if (typeof config.standOption === "string") {
                        // Try to find the option in the current list
                        const option = standOptions.find((o) => o._id === config.standOption)
                        if (option) {
                          optionTitle = option.title
                        } else {
                          optionTitle = "Opción de Stand " + config.standOption.substring(0, 8)
                        }
                      } else if (config.standOption && config.standOption.title) {
                        optionTitle = config.standOption.title
                      }

                      // Get stand option ID for loading state
                      const standOptionId =
                        typeof config.standOption === "string" ? config.standOption : config.standOption?._id
                      const isDownloading = isPdfLoading[standOptionId] || false

                      return (
                        <tr key={config._id || `config-${Math.random()}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {event?.title || "Evento Desconocido"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{optionTitle}</div>
                            {config.totalPrice !== undefined && config.totalPrice > 0 && (
                              <div className="text-xs text-green-600 mt-1">€{config.totalPrice.toFixed(2)}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              {config.isSubmitted ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <Check className="h-3 w-3 mr-1" />
                                  Completado
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  En Progreso
                                </span>
                              )}

                              {config.paymentStatus && (
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(config.paymentStatus)}`}
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  {config.paymentStatus === "completed"
                                    ? "Pagado"
                                    : config.paymentStatus === "processing"
                                      ? "Procesando"
                                      : config.paymentStatus === "cancelled"
                                        ? "Cancelado"
                                        : "Pendiente"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleExportSingleConfig(config)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                JSON
                              </button>
                              <button
                                onClick={() => handleDownloadPdf(config)}
                                disabled={isDownloading}
                                className="text-green-600 hover:text-green-800 flex items-center gap-1"
                              >
                                {isDownloading ? <RefreshCw className="h-3 w-3 animate-spin" /> : "PDF"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
