"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Eye,
  Download,
  FileText,
  RefreshCw,
  AlertCircle,
  Users,
  DollarSign,
  CreditCard,
  FileDown,
} from "lucide-react"
import { getAllEvents } from "@/services/event-service"
import { getStandConfigsByEvent, downloadConfigAsPdf } from "@/services/stand-config-service"
import { getStandOptionById } from "@/services/stand-option-service"
import type { StandConfig } from "@/services/stand-config-service"

export default function StandConfigsTab() {
  const [events, setEvents] = useState<any[]>([])
  const [standConfigs, setStandConfigs] = useState<StandConfig[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedConfig, setSelectedConfig] = useState<StandConfig | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [standOptionDetails, setStandOptionDetails] = useState<any>(null)
  const [isExhibitorViewModalOpen, setIsExhibitorViewModalOpen] = useState(false)
  const [selectedExhibitor, setSelectedExhibitor] = useState<string | null>(null)
  const [exhibitorConfigs, setExhibitorConfigs] = useState<StandConfig[]>([])
  const [standOptionsCache, setStandOptionsCache] = useState<Record<string, any>>({})
  const [isPdfLoading, setIsPdfLoading] = useState<Record<string, boolean>>({})

  // Load events on init
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        const eventsData = await getAllEvents(token)
        setEvents(eventsData)

        // If we have events, select the first one by default
        if (eventsData && eventsData.length > 0) {
          setSelectedEvent(eventsData[0]._id)
        }
      } catch (err: any) {
        console.error("Error fetching events:", err)
        setError(err.message || "Error al cargar la lista de eventos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Load stand configurations
  const fetchStandConfigs = async () => {
    let configsData: StandConfig[] = []
    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // If "all" is selected, fetch configurations for each event
      if (selectedEvent === "all") {
        if (events.length === 0) {
          setSuccessMessage("No hay eventos disponibles para mostrar configuraciones")
          setTimeout(() => setSuccessMessage(null), 5000)
          setStandConfigs([])
          setIsLoading(false)
          return
        }

        // Show loading message for multiple events
        setSuccessMessage("Cargando configuraciones de todos los eventos...")

        // Fetch configurations for each event
        const allConfigsPromises = events.map((event) =>
          getStandConfigsByEvent(event._id, token).catch((err) => {
            console.error(`Error fetching configs for event ${event.title}:`, err)
            return [] // Return empty array on error for this event
          }),
        )

        // Wait for all promises to resolve
        const allConfigsResults = await Promise.all(allConfigsPromises)

        // Combine all configurations
        configsData = allConfigsResults.flat()
      } else if (selectedEvent) {
        // Fetch configurations for the selected event
        try {
          configsData = await getStandConfigsByEvent(selectedEvent, token)
        } catch (apiError: any) {
          console.error("API Error:", apiError)
          setError(`Error al cargar las configuraciones: ${apiError.message || "Error desconocido"}`)
          setStandConfigs([])
          setIsLoading(false)
          return
        }
      } else {
        setSuccessMessage("Seleccione un evento específico para ver sus configuraciones")
        setTimeout(() => setSuccessMessage(null), 5000)
        setStandConfigs([])
        setIsLoading(false)
        return
      }

      // Fetch stand option details for each config to cache them
      const optionsCache: Record<string, any> = { ...standOptionsCache }

      for (const config of configsData) {
        const standOptionId = typeof config.standOption === "string" ? config.standOption : config.standOption?._id

        if (standOptionId && !optionsCache[standOptionId]) {
          try {
            const standOptionData = await getStandOptionById(standOptionId, token)
            optionsCache[standOptionId] = standOptionData
          } catch (err) {
            console.error(`Error fetching stand option details for ${standOptionId}:`, err)
          }
        }
      }

      setStandOptionsCache(optionsCache)
      setStandConfigs(configsData)

      if (configsData.length === 0) {
        setSuccessMessage(
          selectedEvent === "all"
            ? "No se encontraron configuraciones en ningún evento"
            : "No se encontraron configuraciones para este evento",
        )
      } else {
        setSuccessMessage(`${configsData.length} configuraciones cargadas correctamente`)
      }
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error fetching stand configurations:", err)
      setError(err.message || "Error al cargar las configuraciones de stands")
    } finally {
      setIsLoading(false)
    }
  }

  // Load configurations when selected event changes
  useEffect(() => {
    if (selectedEvent) {
      fetchStandConfigs()
    }
  }, [selectedEvent])

  // Function to view configuration details
  const handleViewDetails = async (config: StandConfig) => {
    try {
      setIsLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // If the configuration doesn't have the complete stand option info, fetch it
      if (typeof config.standOption === "string") {
        // Check if we already have this option in cache
        if (standOptionsCache[config.standOption]) {
          setStandOptionDetails(standOptionsCache[config.standOption])
        } else {
          const standOptionData = await getStandOptionById(config.standOption, token)
          setStandOptionDetails(standOptionData)

          // Update cache
          setStandOptionsCache((prev) => ({
            ...prev,
            [config.standOption as string]: standOptionData,
          }))
        }
      } else {
        setStandOptionDetails(config.standOption)
      }

      setSelectedConfig(config)
      setIsDetailModalOpen(true)
    } catch (err: any) {
      console.error("Error fetching stand option details:", err)
      setError(err.message || "Error al cargar los detalles de la opción de stand")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to view all configurations for a single exhibitor
  const handleViewExhibitorConfigs = (userId: string) => {
    // Get all configurations for this exhibitor
    const configs = standConfigs.filter((config) => {
      const configUserId = typeof config.user === "string" ? config.user : config.user?._id
      return configUserId === userId
    })

    if (configs.length === 0) {
      setError("No se encontraron configuraciones para este exhibidor")
      return
    }

    setExhibitorConfigs(configs)
    setSelectedExhibitor(
      typeof configs[0].user === "string"
        ? configs[0].user
        : configs[0].user?.username || configs[0].user?.email || userId,
    )
    setIsExhibitorViewModalOpen(true)
  }

  // Function to download all configurations for an exhibitor as a single PDF
  const handleDownloadAllPdfs = async (configs: StandConfig[]) => {
    try {
      if (configs.length === 0) {
        setError("No hay configuraciones para exportar como PDF")
        return
      }

      const exhibitorId = typeof configs[0].user === "string" ? configs[0].user : configs[0].user?._id

      // Set loading state for this specific exhibitor
      setIsPdfLoading((prev) => ({ ...prev, [`exhibitor-${exhibitorId}`]: true }))

      // Get the token
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

      // URL del backend
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

      // Create a URL with query parameters for all config IDs
      const configIds = configs.map((config) => config._id).join(",")
      const pdfUrl = `${apiBaseUrl}/api/stand-config/configs/pdf?ids=${configIds}`

      // Fetch the combined PDF
      const response = await fetch(pdfUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Error al descargar PDF combinado (${response.status}):`, errorText)
        throw new Error(`Error downloading combined PDF: ${response.status}`)
      }

      // Get the blob of the PDF
      const blob = await response.blob()

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)

      // Get exhibitor name for the filename
      const exhibitorName =
        typeof configs[0].user === "string"
          ? configs[0].user
          : configs[0].user?.username || configs[0].user?.email || exhibitorId

      // Create a link to download the file
      const a = document.createElement("a")
      a.href = url
      a.download = `configuraciones-${exhibitorName.replace(/\s+/g, "-").toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccessMessage("PDF combinado descargado correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error downloading combined PDF:", err)
      setError(err.message || "Error al descargar el PDF combinado")
    } finally {
      // Clear loading state for this specific exhibitor
      const exhibitorId = typeof configs[0].user === "string" ? configs[0].user : configs[0].user?._id
      setIsPdfLoading((prev) => ({ ...prev, [`exhibitor-${exhibitorId}`]: false }))
    }
  }

  // Function to download configuration as PDF
  const handleDownloadPdf = async (config: StandConfig) => {
    try {
      // Usar directamente el ID de la configuración en lugar del ID de la opción de stand
      const configId = config._id

      if (!configId) {
        throw new Error("Configuration ID not found")
      }

      // Set loading state for this specific config
      setIsPdfLoading((prev) => ({ ...prev, [configId]: true }))

      // Intentar descargar el PDF
      await downloadConfigAsPdf(configId)
      setSuccessMessage("PDF descargado correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error downloading PDF:", err)
      setError(
        `Error al descargar el PDF: ${err.message}. Verifica que tu servidor backend esté ejecutándose en http://localhost:4000 y que el endpoint /api/stand-config/config/:id/pdf esté implementado correctamente.`,
      )
    } finally {
      // Clear loading state for this specific config
      const configId = config._id
      if (configId) {
        setIsPdfLoading((prev) => ({ ...prev, [configId]: false }))
      }
    }
  }

  // Function to get human-readable label for a field
  const getFieldLabel = (standOption: any, fieldId: string) => {
    if (!standOption || !standOption.items) return fieldId

    const item = standOption.items.find((item: any) => item._id === fieldId)
    return item ? item.label : fieldId
  }

  // Function to get human-readable option label
  const getOptionLabel = (standOption: any, fieldId: string, optionId: string) => {
    if (!standOption || !standOption.items) return optionId

    const item = standOption.items.find((item: any) => item._id === fieldId)
    if (!item || !item.options) return optionId

    const option = item.options.find((opt: any) => opt._id === optionId)
    return option ? option.label : optionId
  }

  // Function to get payment status badge color
  const getPaymentStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-900/20 text-green-500 border border-green-500/30"
      case "processing":
        return "bg-blue-900/20 text-blue-400 border border-blue-500/30"
      case "cancelled":
        return "bg-red-900/20 text-red-500 border border-red-500/30"
      case "pending":
      default:
        return "bg-yellow-900/20 text-yellow-500 border border-yellow-500/30"
    }
  }

  // Function to export all configurations for an exhibitor as a single JSON file
  const handleExportExhibitorConfigs = (configs: StandConfig[]) => {
    try {
      if (configs.length === 0) {
        setError("No hay configuraciones para exportar")
        return
      }

      const exhibitorId = typeof configs[0].user === "string" ? configs[0].user : configs[0].user?._id
      const exhibitorName =
        typeof configs[0].user === "string"
          ? configs[0].user
          : configs[0].user?.username || configs[0].user?.email || exhibitorId

      // Get exhibitor's full name if available
      const exhibitorFullName =
        typeof configs[0].user === "string"
          ? ""
          : `${configs[0].user?.firstName || ""} ${configs[0].user?.lastName || ""}`.trim()

      const eventId = typeof configs[0].event === "string" ? configs[0].event : configs[0].event?._id

      // Get event name from the events list
      const eventObj = events.find((e) => e._id === eventId)
      const eventName = eventObj
        ? eventObj.title
        : typeof configs[0].event === "string"
          ? configs[0].event
          : configs[0].event?.title || eventId

      // Process configurations and calculate grand total
      let grandTotal = 0
      const processedConfigurations = configs.map((config) => {
        const standOptionId = typeof config.standOption === "string" ? config.standOption : config.standOption?._id
        const standOption = standOptionsCache[standOptionId] || config.standOption

        const standOptionName = typeof standOption === "string" ? standOption : standOption?.title || "Unknown"

        // Get configuration data
        const configData = config.configData || {}

        // Extract total price from config or metadata
        let configTotalPrice = config.totalPrice || 0
        if (!configTotalPrice && configData._metadata?.totalPrice) {
          configTotalPrice = Number.parseFloat(configData._metadata.totalPrice) || 0
        }

        // Get price breakdown
        const priceBreakdown = config.priceBreakdown || configData._metadata?.priceBreakdown || {}

        // Add to grand total
        grandTotal += configTotalPrice

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
          type: standOptionName,
          isSubmitted: config.isSubmitted,
          isPaid: config.isPaid || false,
          paymentStatus: config.paymentStatus || "pending",
          lastUpdated: config.updatedAt || "Unknown",
          totalPrice: configTotalPrice,
          priceBreakdown: priceBreakdown,
          items: processedItems,
        }
      })

      // Create a consolidated export object with human-readable data
      const exportData = {
        exhibitor: {
          id: exhibitorId,
          email: exhibitorName,
          name: exhibitorFullName,
        },
        event: {
          id: eventId,
          name: eventName,
        },
        exportDate: new Date().toISOString(),
        grandTotal: grandTotal,
        configurations: processedConfigurations,
      }

      // Convert to JSON
      const jsonString = JSON.stringify(exportData, null, 2)

      // Create a blob and download link
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)

      // Create a link and click it to download
      const a = document.createElement("a")
      a.href = url
      a.download = `exhibitor-configs-${exhibitorName.replace(/\s+/g, "-").toLowerCase()}.json`
      document.body.appendChild(a)
      a.click()

      // Clean up
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccessMessage("Configuraciones exportadas correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error exporting configurations:", err)
      setError(err.message || "Error al exportar las configuraciones")
    }
  }

  // Function to export a single configuration as JSON
  const handleExportConfig = (config: StandConfig) => {
    try {
      const standOptionId = typeof config.standOption === "string" ? config.standOption : config.standOption?._id

      // Get stand option details from cache or from the config
      const standOption =
        standOptionsCache[standOptionId] ||
        (typeof config.standOption === "string" ? standOptionDetails : config.standOption)

      // Get event details
      const eventId = typeof config.event === "string" ? config.event : config.event?._id
      const eventObj = events.find((e) => e._id === eventId)
      const eventName = eventObj
        ? eventObj.title
        : typeof config.event === "string"
          ? config.event
          : config.event?.title || eventId

      // Get exhibitor details
      const exhibitorId = typeof config.user === "string" ? config.user : config.user?._id
      const exhibitorEmail = typeof config.user === "string" ? config.user : config.user?.email || "Unknown"
      const exhibitorFullName =
        typeof config.user === "string" ? "" : `${config.user?.firstName || ""} ${config.user?.lastName || ""}`.trim()

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
          id: exhibitorId,
          email: exhibitorEmail,
          name: exhibitorFullName,
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

      // Clean up
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccessMessage("Configuración exportada correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error exporting configuration:", err)
      setError(`Error al exportar la configuración: ${err.message}`)
    }
  }

  // Get unique exhibitors from configurations
  const getUniqueExhibitors = () => {
    const exhibitors = new Map()

    standConfigs.forEach((config) => {
      const userId = typeof config.user === "string" ? config.user : config.user?._id
      const username =
        typeof config.user === "string" ? config.user : config.user?.username || config.user?.email || userId

      if (userId && !exhibitors.has(userId)) {
        exhibitors.set(userId, { id: userId, name: username })
      }
    })

    return Array.from(exhibitors.values())
  }

  // Filter configurations based on search term
  const filteredConfigs = standConfigs.filter((config) => {
    if (!searchTerm.trim()) return true // If search is empty, show all

    const searchTermLower = searchTerm.toLowerCase().trim()

    // Search in username/email (handle both string and object formats)
    const username = typeof config.user === "string" ? config.user : config.user?.username || config.user?.email || ""

    // Search in event title (handle both string and object formats)
    const eventTitle = typeof config.event === "string" ? config.event : config.event?.title || ""

    // Get event ID to match against event IDs in the events array
    const eventId = typeof config.event === "string" ? config.event : config.event?._id

    // Look up event name from events array if we have an ID
    const eventFromList = events.find((e) => e._id === eventId)
    const eventName = eventFromList?.title || ""

    // Search in stand option title (handle both string and object formats)
    const standOptionTitle =
      typeof config.standOption === "string" ? config.standOption : config.standOption?.title || ""

    // Get stand option ID
    const standOptionId = typeof config.standOption === "string" ? config.standOption : config.standOption?._id

    // Look up stand option from cache if we have an ID
    const standOptionFromCache = standOptionsCache[standOptionId]
    const standOptionName = standOptionFromCache?.title || ""

    // Check if any of these fields contain the search term
    return (
      username.toLowerCase().includes(searchTermLower) ||
      eventTitle.toLowerCase().includes(searchTermLower) ||
      eventName.toLowerCase().includes(searchTermLower) ||
      standOptionTitle.toLowerCase().includes(searchTermLower) ||
      standOptionName.toLowerCase().includes(searchTermLower)
    )
  })

  // Group configurations by exhibitor
  const configsByExhibitor = filteredConfigs.reduce(
    (acc, config) => {
      const userId = typeof config.user === "string" ? config.user : config.user?._id
      if (!userId) return acc

      if (!acc[userId]) {
        acc[userId] = []
      }

      acc[userId].push(config)
      return acc
    },
    {} as Record<string, StandConfig[]>,
  )

  // Function to render a configuration field value
  const renderConfigValue = (value: any, standOption: any, fieldId: string) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">No proporcionado</span>
    }

    if (typeof value === "boolean") {
      return value ? "Sí" : "No"
    }

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return (
          <ul className="list-disc pl-5">
            {value.map((item, index) => (
              <li key={index}>{renderConfigValue(item, standOption, fieldId)}</li>
            ))}
          </ul>
        )
      }

      return (
        <div className="bg-rich-black/50 p-2 rounded-md mt-1">
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
        </div>
      )
    }

    if (typeof value === "string") {
      // If it's a URL, render as a link
      if (value.startsWith("http://") || value.startsWith("https://")) {
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            {value}
          </a>
        )
      }

      // If it looks like an ID and we have a stand option, try to resolve it
      if (value.length > 20 && standOption && standOption.items) {
        const item = standOption.items.find((item: any) => item._id === fieldId)
        if (item && item.options) {
          const option = item.options.find((opt: any) => opt._id === value)
          if (option) {
            return (
              <div>
                <span className="font-medium">{option.label}</span>
                {option.price > 0 && <span className="ml-2 text-green-500">€{option.price.toFixed(2)}</span>}
                {option.description && <p className="text-sm text-gray-400 mt-1">{option.description}</p>}
              </div>
            )
          }
        }
      }
    }

    return String(value)
  }

  return (
    <div>
      {error && (
        <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-4">
          <p className="text-white flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-900/20 border border-green-500 p-4 rounded-md mb-4">
          <p className="text-white flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            {successMessage}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-burgundy" />
          <span>Configuraciones de Stands</span>
        </h2>
        <button
          onClick={fetchStandConfigs}
          className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span>Actualizar</span>
        </button>
      </div>

      {/* Event selector and search bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <select
          className="px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          <option value="all">Todos los eventos</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.title}
            </option>
          ))}
        </select>

        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
          <input
            type="text"
            placeholder="Buscar por exhibidor, evento o tipo de stand..."
            className="w-full pl-10 pr-10 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-light hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {searchTerm && filteredConfigs.length > 0 && (
        <div className="mt-2 text-sm text-gray-light">
          Se encontraron {filteredConfigs.length} configuraciones para "{searchTerm}"
        </div>
      )}

      {/* Exhibitor list with their configurations */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
          <p className="mt-4 text-gray-light">Cargando configuraciones...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(configsByExhibitor).length > 0 ? (
            Object.entries(configsByExhibitor).map(([userId, configs]) => {
              const exhibitorName =
                typeof configs[0].user === "string"
                  ? configs[0].user
                  : configs[0].user?.username || configs[0].user?.email || userId

              return (
                <div
                  key={userId}
                  className="bg-dark-gray p-4 rounded-lg border border-transparent hover:border-gold/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between">
                    <div className="mb-4 sm:mb-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-burgundy" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{exhibitorName}</h3>
                          <p className="text-gray-light text-sm">
                            {configs.length} configuraciones para este exhibidor
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-start">
                      <button
                        onClick={() => handleViewExhibitorConfigs(userId)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-gold/50 hover:bg-gold/10 text-gold rounded-md transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver Todas las Configuraciones</span>
                      </button>
                      <button
                        onClick={() => handleExportExhibitorConfigs(configs)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-sm"
                      >
                        <Download className="h-4 w-4" />
                        <span>Exportar JSON</span>
                      </button>
                      <button
                        onClick={() => handleDownloadAllPdfs(configs)}
                        disabled={isPdfLoading[`exhibitor-${userId}`]}
                        className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-green-500/50 hover:bg-green-500/10 text-green-400 rounded-md transition-colors text-sm"
                      >
                        {isPdfLoading[`exhibitor-${userId}`] ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="h-4 w-4" />
                        )}
                        <span>Descargar PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* List of configurations for this exhibitor */}
                  <div className="mt-4 grid gap-3">
                    {configs.map((config) => {
                      // Get event name
                      const eventId = typeof config.event === "string" ? config.event : config.event?._id
                      const eventObj = events.find((e) => e._id === eventId)
                      const eventName = eventObj
                        ? eventObj.title
                        : typeof config.event === "string"
                          ? config.event
                          : config.event?.title || eventId

                      // Get stand option ID for loading state
                      const standOptionId =
                        typeof config.standOption === "string" ? config.standOption : config.standOption?._id
                      const isDownloading = isPdfLoading[standOptionId] || false

                      return (
                        <div
                          key={config._id}
                          className="bg-rich-black p-3 rounded-md border border-gray-800 hover:border-gray-700 transition-all"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">
                                {typeof config.standOption === "string"
                                  ? `Configuración #${config._id.substring(0, 8)}`
                                  : config.standOption?.title || `Configuración #${config._id.substring(0, 8)}`}
                              </h4>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-900/20 text-blue-400 border border-blue-500/30">
                                  {eventName}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    config.isSubmitted
                                      ? "bg-green-900/20 text-green-500 border border-green-500/30"
                                      : "bg-yellow-900/20 text-yellow-500 border border-yellow-500/30"
                                  }`}
                                >
                                  {config.isSubmitted ? "Enviado" : "Borrador"}
                                </span>
                                {config.paymentStatus && (
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${getPaymentStatusColor(
                                      config.paymentStatus,
                                    )}`}
                                  >
                                    <CreditCard className="h-3 w-3" />
                                    <span>
                                      {config.paymentStatus === "completed"
                                        ? "Pagado"
                                        : config.paymentStatus === "processing"
                                          ? "Procesando"
                                          : config.paymentStatus === "cancelled"
                                            ? "Cancelado"
                                            : "Pendiente"}
                                    </span>
                                  </span>
                                )}
                                {config.totalPrice !== undefined && config.totalPrice > 0 && (
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-900/20 text-green-500 border border-green-500/30 flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    <span>€{config.totalPrice.toFixed(2)}</span>
                                  </span>
                                )}
                                {config.updatedAt && (
                                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700/30 text-gray-light border border-gray-600/30">
                                    Actualizado: {new Date(config.updatedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewDetails(config)}
                                className="flex items-center gap-1 px-2 py-1 bg-dark-gray border border-gold/50 hover:bg-gold/10 text-gold rounded-md transition-colors text-xs"
                              >
                                <Eye className="h-3 w-3" />
                                <span>Detalles</span>
                              </button>
                              <button
                                onClick={() => handleExportConfig(config)}
                                className="flex items-center gap-1 px-2 py-1 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-xs"
                              >
                                <Download className="h-3 w-3" />
                                <span>JSON</span>
                              </button>
                              <button
                                onClick={() => handleDownloadPdf(config)}
                                disabled={isDownloading}
                                className="flex items-center gap-1 px-2 py-1 bg-dark-gray border border-green-500/50 hover:bg-green-500/10 text-green-400 rounded-md transition-colors text-xs"
                              >
                                {isDownloading ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <FileDown className="h-3 w-3" />
                                )}
                                <span>PDF</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          ) : searchTerm ? (
            <div className="text-center py-12 bg-dark-gray rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-gray-light mb-4" />
              <h3 className="text-xl font-bold mb-2">No se encontraron resultados</h3>
              <p className="text-gray-light mb-6">
                No se encontraron configuraciones que coincidan con "{searchTerm}".
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 bg-burgundy hover:bg-burgundy/90 text-white rounded-md transition-colors"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : selectedEvent === "all" ? (
            <div className="text-center py-12 bg-dark-gray rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-gray-light mb-4" />
              <h3 className="text-xl font-bold mb-2">No hay configuraciones</h3>
              <p className="text-gray-light mb-6">No se encontraron configuraciones de stands para ningún evento.</p>
            </div>
          ) : (
            <div className="text-center py-12 bg-dark-gray rounded-lg">
              <FileText className="h-12 w-12 mx-auto text-gray-light mb-4" />
              <h3 className="text-xl font-bold mb-2">No hay configuraciones</h3>
              <p className="text-gray-light mb-6">No se encontraron configuraciones de stands para este evento.</p>
            </div>
          )}
        </div>
      )}

      {/* Single configuration details modal */}
      {isDetailModalOpen && selectedConfig && (
        <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-dark-gray rounded-lg p-8 max-w-4xl w-full my-8 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Detalles de Configuración</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-light hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* General information */}
              <div className="bg-rich-black p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-3">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-light text-sm">ID de Configuración</p>
                    <p className="font-mono">{selectedConfig._id}</p>
                  </div>
                  <div>
                    <p className="text-gray-light text-sm">Estado</p>
                    <p className={selectedConfig.isSubmitted ? "text-green-500" : "text-yellow-500"}>
                      {selectedConfig.isSubmitted ? "Enviado" : "Borrador"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-light text-sm">Estado de Pago</p>
                    <p
                      className={
                        selectedConfig.paymentStatus === "completed"
                          ? "text-green-500"
                          : selectedConfig.paymentStatus === "processing"
                            ? "text-blue-400"
                            : selectedConfig.paymentStatus === "cancelled"
                              ? "text-red-500"
                              : "text-yellow-500"
                      }
                    >
                      {selectedConfig.paymentStatus === "completed"
                        ? "Pagado"
                        : selectedConfig.paymentStatus === "processing"
                          ? "Procesando"
                          : selectedConfig.paymentStatus === "cancelled"
                            ? "Cancelado"
                            : "Pendiente"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-light text-sm">Exhibitor</p>
                    <p>
                      {typeof selectedConfig.user === "string"
                        ? selectedConfig.user
                        : selectedConfig.user?.username || selectedConfig.user?.email || "Usuario desconocido"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-light text-sm">Evento</p>
                    <p>
                      {(() => {
                        const eventId =
                          typeof selectedConfig.event === "string" ? selectedConfig.event : selectedConfig.event?._id
                        const eventObj = events.find((e) => e._id === eventId)
                        return eventObj
                          ? eventObj.title
                          : typeof selectedConfig.event === "string"
                            ? selectedConfig.event
                            : selectedConfig.event?.title || "Evento desconocido"
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-light text-sm">Opción de Stand</p>
                    <p>
                      {typeof selectedConfig.standOption === "string"
                        ? standOptionDetails?.title || selectedConfig.standOption
                        : selectedConfig.standOption?.title || "Opción desconocida"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-light text-sm">Precio Total</p>
                    <p className="text-green-500 font-medium">€{selectedConfig.totalPrice?.toFixed(2) || "0.00"}</p>
                  </div>
                  <div>
                    <p className="text-gray-light text-sm">Última Actualización</p>
                    <p>
                      {selectedConfig.updatedAt ? new Date(selectedConfig.updatedAt).toLocaleString() : "Desconocida"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price breakdown if available */}
              {selectedConfig.priceBreakdown && Object.keys(selectedConfig.priceBreakdown).length > 0 && (
                <div className="bg-rich-black p-4 rounded-lg">
                  <h3 className="text-lg font-bold mb-3">Desglose de Precios</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedConfig.priceBreakdown).map(([category, price]) => (
                      <div
                        key={category}
                        className="flex justify-between items-center border-b border-gray-700 pb-2 last:border-0"
                      >
                        <span className="text-gray-300">{category}</span>
                        <span className="text-green-500">€{Number(price).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 font-medium">
                      <span className="text-white">Total</span>
                      <span className="text-green-500">€{selectedConfig.totalPrice?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration */}
              <div className="bg-rich-black p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-3">Respuestas de Configuración</h3>

                {/* Handle both old and new structure */}
                {selectedConfig.configData && Object.keys(selectedConfig.configData).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(selectedConfig.configData).map(([key, value]) => {
                      if (key === "_metadata") return null

                      // Find the corresponding item in the stand option to get the label
                      const standItem = standOptionDetails?.items?.find((item: any) => item._id === key)

                      const label = standItem?.label || key

                      return (
                        <div key={key} className="border-b border-gray-700 pb-3 last:border-0">
                          <p className="font-medium text-gold">{label}</p>
                          <div className="mt-1">{renderConfigValue(value, standOptionDetails, key)}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-light">No hay datos de configuración disponibles.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => handleExportConfig(selectedConfig)}
                className="flex items-center gap-1 px-4 py-2 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Exportar JSON</span>
              </button>

              {/* Add PDF download button */}
              <button
                onClick={() => handleDownloadPdf(selectedConfig)}
                disabled={
                  isPdfLoading[
                    typeof selectedConfig.standOption === "string"
                      ? selectedConfig.standOption
                      : selectedConfig.standOption?._id
                  ]
                }
                className="flex items-center gap-1 px-4 py-2 bg-dark-gray border border-green-500/50 hover:bg-green-500/10 text-green-400 rounded-md transition-colors"
              >
                {isPdfLoading[
                  typeof selectedConfig.standOption === "string"
                    ? selectedConfig.standOption
                    : selectedConfig.standOption?._id
                ] ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                <span>Descargar PDF</span>
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-burgundy hover:bg-burgundy/90 text-white rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exhibitor consolidated view modal */}
      {isExhibitorViewModalOpen && selectedExhibitor && (
        <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-dark-gray rounded-lg p-8 max-w-5xl w-full my-8 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Todas las Configuraciones para {selectedExhibitor}</h2>
              <button onClick={() => setIsExhibitorViewModalOpen(false)} className="text-gray-light hover:text-white">
                ✕
              </button>
            </div>

            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-light">{exhibitorConfigs.length} configuraciones encontradas</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportExhibitorConfigs(exhibitorConfigs)}
                  className="flex items-center gap-1 px-4 py-2 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar Todo como JSON</span>
                </button>
                <button
                  onClick={() => handleDownloadAllPdfs(exhibitorConfigs)}
                  disabled={isPdfLoading[`exhibitor-${selectedExhibitor}`]}
                  className="flex items-center gap-1 px-4 py-2 bg-dark-gray border border-green-500/50 hover:bg-green-500/10 text-green-400 rounded-md transition-colors"
                >
                  {isPdfLoading[`exhibitor-${selectedExhibitor}`] ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>

            {/* Consolidated view of all configurations */}
            <div className="space-y-6">
              {exhibitorConfigs.map((config) => {
                const standOptionId =
                  typeof config.standOption === "string" ? config.standOption : config.standOption?._id
                const standOption = standOptionsCache[standOptionId] || config.standOption

                const standOptionName =
                  typeof standOption === "string" ? standOption : standOption?.title || "Configuración desconocida"

                // Get event name
                const eventId = typeof config.event === "string" ? config.event : config.event?._id
                const eventObj = events.find((e) => e._id === eventId)
                const eventName = eventObj
                  ? eventObj.title
                  : typeof config.event === "string"
                    ? config.event
                    : config.event?.title || eventId

                const isDownloading = isPdfLoading[standOptionId] || false

                return (
                  <div key={config._id} className="bg-rich-black p-4 rounded-lg">
                    <h3 className="text-lg font-bold mb-3 flex justify-between">
                      <span>{standOptionName}</span>
                      <div className="flex gap-2">
                        <span
                          className={`text-sm px-2 py-0.5 rounded-full ${
                            config.isSubmitted
                              ? "bg-green-900/20 text-green-500 border border-green-500/30"
                              : "bg-yellow-900/20 text-yellow-500 border border-yellow-500/30"
                          }`}
                        >
                          {config.isSubmitted ? "Enviado" : "Borrador"}
                        </span>
                        {config.paymentStatus && (
                          <span
                            className={`text-sm px-2 py-0.5 rounded-full flex items-center gap-1 ${getPaymentStatusColor(
                              config.paymentStatus,
                            )}`}
                          >
                            <CreditCard className="h-3 w-3" />
                            <span>
                              {config.paymentStatus === "completed"
                                ? "Pagado"
                                : config.paymentStatus === "processing"
                                  ? "Procesando"
                                  : config.paymentStatus === "cancelled"
                                    ? "Cancelado"
                                    : "Pendiente"}
                            </span>
                          </span>
                        )}
                      </div>
                    </h3>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-900/20 text-blue-400 border border-blue-500/30">
                        {eventName}
                      </span>
                      {config.totalPrice !== undefined && config.totalPrice > 0 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-900/20 text-green-500 border border-green-500/30 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>€{config.totalPrice.toFixed(2)}</span>
                        </span>
                      )}
                      {config.updatedAt && (
                        <span className="text-sm text-gray-light">
                          Última actualización: {new Date(config.updatedAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Add buttons for export and PDF download */}
                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={() => handleExportConfig(config)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 rounded-md transition-colors text-sm"
                      >
                        <Download className="h-4 w-4" />
                        <span>Exportar JSON</span>
                      </button>

                      <button
                        onClick={() => handleDownloadPdf(config)}
                        disabled={isDownloading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-green-500/50 hover:bg-green-500/10 text-green-400 rounded-md transition-colors text-sm"
                      >
                        {isDownloading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="h-4 w-4" />
                        )}
                        <span>Descargar PDF</span>
                      </button>
                    </div>

                    {/* Price breakdown if available */}
                    {config.priceBreakdown && Object.keys(config.priceBreakdown).length > 0 && (
                      <div className="mb-4 bg-rich-black/50 p-3 rounded-md border border-gray-700">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Desglose de Precios</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(config.priceBreakdown).map(([category, price]) => (
                            <div key={category} className="flex justify-between items-center">
                              <span className="text-gray-400">{category}</span>
                              <span className="text-green-500">€{Number(price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Handle both old and new structure */}
                    {config.configData && Object.keys(config.configData).length > 0 ? (
                      <div className="space-y-4 mt-4">
                        {Object.entries(config.configData).map(([key, value]) => {
                          if (key === "_metadata") return null

                          // Try to get the label from the stand option
                          let label = key
                          if (standOption && standOption.items) {
                            const item = standOption.items.find((item: any) => item._id === key)
                            if (item) {
                              label = item.label
                            }
                          }

                          return (
                            <div key={key} className="border-b border-gray-700 pb-3 last:border-0">
                              <p className="font-medium text-gold">{label}</p>
                              <div className="mt-1">{renderConfigValue(value, standOption, key)}</div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-light">No hay datos de configuración disponibles.</p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setIsExhibitorViewModalOpen(false)}
                className="px-4 py-2 bg-burgundy hover:bg-burgundy/90 text-white rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
