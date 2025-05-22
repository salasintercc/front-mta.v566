"use client"

import { useState, useEffect } from "react"
import { Search, Check, X, RefreshCw, AlertCircle, Info, Lock, Unlock } from "lucide-react"
import { getAllEvents } from "@/services/event-service"
import {
  getEnabledExhibitorsForEvent,
  enableExhibitorStandConfig,
  disableExhibitorStandConfig,
  getAllExhibitors,
  type ExhibitorConfig,
} from "@/services/event-exhibitor-config-service"

export default function ExhibitorPermissionsTab() {
  const [events, setEvents] = useState<any[]>([])
  const [exhibitors, setExhibitors] = useState<any[]>([])
  const [enabledExhibitors, setEnabledExhibitors] = useState<ExhibitorConfig[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAddingExhibitor, setIsAddingExhibitor] = useState(false)
  const [selectedExhibitorToAdd, setSelectedExhibitorToAdd] = useState<string>("")

  // Cargar eventos al iniciar
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
      } catch (err: any) {
        console.error("Error fetching events:", err)
        setError(err.message || "Error al cargar la lista de eventos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Cargar exhibitors habilitados cuando se selecciona un evento
  useEffect(() => {
    if (selectedEvent) {
      fetchEnabledExhibitors()
      fetchAllExhibitors()
    }
  }, [selectedEvent])

  const fetchEnabledExhibitors = async () => {
    if (!selectedEvent) return

    try {
      setIsLoading(true)
      const data = await getEnabledExhibitorsForEvent(selectedEvent)
      setEnabledExhibitors(data)
    } catch (err: any) {
      console.error("Error fetching enabled exhibitors:", err)
      setError(err.message || "Error al cargar los exhibitors habilitados")
    } finally {
      setIsLoading(false)
    }
  }

  // Modificar la función fetchAllExhibitors para mostrar mejor los datos y manejar errores
  const fetchAllExhibitors = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAllExhibitors()

      if (data.length === 0) {
        console.log("No se encontraron exhibitors")
      } else {
        console.log(`Se encontraron ${data.length} exhibitors`)
      }

      // Filtrar solo usuarios con role: "exhibitor"
      const filteredData = data.filter((user) => user.role === "exhibitor")
      setExhibitors(filteredData)
    } catch (err: any) {
      console.error("Error fetching all exhibitors:", err)
      setError(err.message || "Error al cargar la lista de exhibitors")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableExhibitor = async (userId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await enableExhibitorStandConfig(userId, selectedEvent)
      setSuccessMessage("Exhibitor habilitado correctamente")
      fetchEnabledExhibitors() // Recargar la lista
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error enabling exhibitor:", err)
      setError(err.message || "Error al habilitar al exhibitor")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableExhibitor = async (userId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await disableExhibitorStandConfig(userId, selectedEvent)
      setSuccessMessage("Permiso revocado correctamente")
      fetchEnabledExhibitors() // Recargar la lista
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error disabling exhibitor:", err)
      setError(err.message || "Error al revocar el permiso del exhibitor")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddExhibitor = async () => {
    if (!selectedExhibitorToAdd) {
      setError("Selecciona un exhibitor para añadir")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await enableExhibitorStandConfig(selectedExhibitorToAdd, selectedEvent)
      setSuccessMessage("Exhibitor añadido correctamente")
      fetchEnabledExhibitors() // Recargar la lista
      setIsAddingExhibitor(false)
      setSelectedExhibitorToAdd("")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error adding exhibitor:", err)
      setError(err.message || "Error al añadir al exhibitor")
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar exhibitors habilitados según el término de búsqueda
  const filteredExhibitors = enabledExhibitors.filter((exhibitor) => {
    const searchTermLower = searchTerm.toLowerCase()
    return (
      exhibitor.user?.username?.toLowerCase().includes(searchTermLower) ||
      exhibitor.user?.email?.toLowerCase().includes(searchTermLower) ||
      exhibitor.user?.fullName?.toLowerCase().includes(searchTermLower) ||
      exhibitor.user?.company?.toLowerCase().includes(searchTermLower)
    )
  })

  // Filtrar exhibitors disponibles para añadir (que no estén ya habilitados)
  const availableExhibitors = exhibitors.filter(
    (exhibitor) => !enabledExhibitors.some((enabled) => enabled.user?._id === exhibitor._id),
  )

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
            <Check className="h-5 w-5 mr-2" />
            {successMessage}
          </p>
        </div>
      )}

      {/* Nota informativa sobre los campos isEnabled e isStandConfigEnabled */}
      <div className="bg-blue-900/20 border border-blue-500 p-4 rounded-md mb-6">
        <p className="text-white flex items-center">
          <Info className="h-5 w-5 mr-2 text-blue-500" />
          <span>
            <strong>Importante:</strong> Al habilitar un exhibitor, se activarán automáticamente los campos{" "}
            <code>isEnabled</code> e <code>isStandConfigEnabled</code>. Esto permite al exhibitor participar en el
            evento y configurar su stand.
          </span>
        </p>
      </div>

      {/* Selector de evento */}
      <div className="mb-6">
        <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="eventSelector">
          Seleccionar Evento
        </label>
        <select
          id="eventSelector"
          className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          <option value="">Selecciona un evento</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <>
          {/* Barra de búsqueda y botón para añadir */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
              <input
                type="text"
                placeholder="Buscar exhibitors habilitados..."
                className="w-full pl-10 pr-4 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setIsAddingExhibitor(true)
                setSearchTerm("")
              }}
              className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Añadir Exhibitor</span>
            </button>
          </div>

          {/* Botón para ver todos los exhibitors disponibles */}
          <div className="mb-6">
            <button
              onClick={() => {
                fetchAllExhibitors()
                setIsAddingExhibitor(true)
                setSearchTerm("")
              }}
              className="text-gold hover:text-gold/80 underline flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Ver todos los exhibitors disponibles</span>
            </button>
          </div>

          {/* Modal para añadir exhibitor */}
          {isAddingExhibitor && (
            <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center">
              <div className="bg-dark-gray rounded-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Añadir Exhibitor</h2>
                <p className="text-gray-light mb-6">
                  Selecciona un exhibitor para habilitarlo a configurar su stand en el evento seleccionado.
                </p>

                {/* Nota sobre los permisos */}
                <div className="bg-blue-900/20 border border-blue-500 p-3 rounded-md mb-4">
                  <p className="text-white text-sm flex items-start">
                    <Info className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Al añadir un exhibitor, se habilitarán automáticamente los permisos para participar en el evento (
                      <code>isEnabled</code>) y para configurar su stand (<code>isStandConfigEnabled</code>).
                    </span>
                  </p>
                </div>

                {/* Buscador de exhibitors */}
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
                  <input
                    type="text"
                    placeholder="Buscar exhibitor por nombre, email o empresa..."
                    className="w-full pl-10 pr-4 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Lista de exhibitors filtrada */}
                <div className="max-h-60 overflow-y-auto mb-4 border border-gray-700 rounded-md">
                  {availableExhibitors.length === 0 ? (
                    <div className="p-4 text-center text-gray-light">No hay exhibitors disponibles para añadir</div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {availableExhibitors
                        .filter((exhibitor) => {
                          // Solo mostrar usuarios con role: "exhibitor"
                          if (exhibitor.role !== "exhibitor") return false

                          if (!searchTerm) return true
                          const term = searchTerm.toLowerCase()
                          return (
                            exhibitor.username?.toLowerCase().includes(term) ||
                            exhibitor.email?.toLowerCase().includes(term) ||
                            exhibitor.firstName?.toLowerCase().includes(term) ||
                            exhibitor.lastName?.toLowerCase().includes(term) ||
                            exhibitor.empresa?.toLowerCase().includes(term)
                          )
                        })
                        .map((exhibitor) => (
                          <div
                            key={exhibitor._id}
                            className={`p-3 cursor-pointer hover:bg-gray-700/30 transition-colors ${
                              selectedExhibitorToAdd === exhibitor._id
                                ? "bg-burgundy/20 border-l-4 border-burgundy"
                                : ""
                            }`}
                            onClick={() => setSelectedExhibitorToAdd(exhibitor._id)}
                          >
                            <div className="font-medium">
                              {exhibitor.username || `${exhibitor.firstName || ""} ${exhibitor.lastName || ""}`}
                              <span className="ml-2 text-xs bg-green-900/30 text-green-500 px-2 py-0.5 rounded-full">
                                role: exhibitor
                              </span>
                            </div>
                            <div className="text-sm text-gray-light">{exhibitor.email}</div>
                            {exhibitor.empresa && <div className="text-xs mt-1 text-gold">{exhibitor.empresa}</div>}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setIsAddingExhibitor(false)
                      setSearchTerm("")
                    }}
                    className="px-4 py-2 rounded-md text-gray-light hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddExhibitor}
                    className="px-4 py-2 rounded-md bg-burgundy hover:bg-burgundy/90 text-white transition-colors"
                    disabled={isLoading || !selectedExhibitorToAdd}
                  >
                    {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Añadir"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de exhibitors habilitados */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Exhibitors con Permisos de Configuración</h3>
              <button
                onClick={fetchEnabledExhibitors}
                className="text-gray-light hover:text-white flex items-center gap-1"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                <span>Actualizar</span>
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                <p className="mt-4 text-gray-light">Cargando exhibitors...</p>
              </div>
            ) : (
              <>
                {filteredExhibitors.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredExhibitors.map((exhibitor) => (
                      <div
                        key={exhibitor._id}
                        className="bg-dark-gray p-4 rounded-lg border border-transparent hover:border-gold/30 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between">
                          <div className="mb-4 sm:mb-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-burgundy/20 h-10 w-10 rounded-full flex items-center justify-center">
                                <Check className="h-5 w-5 text-burgundy" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{exhibitor.user?.username}</h3>
                                <p className="text-gray-light text-sm">{exhibitor.user?.email}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-3">
                              {exhibitor.user?.company && (
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-700/30 text-gray-light border border-gray-600/30">
                                  {exhibitor.user.company}
                                </span>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                                    exhibitor.isEnabled
                                      ? "bg-green-900/20 text-green-500 border border-green-500/30"
                                      : "bg-red-900/20 text-red-500 border border-red-500/30"
                                  }`}
                                >
                                  {exhibitor.isEnabled ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                  <span>
                                    {exhibitor.isEnabled ? "Participación Habilitada" : "Participación Deshabilitada"}
                                  </span>
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                                    exhibitor.isStandConfigEnabled
                                      ? "bg-green-900/20 text-green-500 border border-green-500/30"
                                      : "bg-red-900/20 text-red-500 border border-red-500/30"
                                  }`}
                                >
                                  {exhibitor.isStandConfigEnabled ? (
                                    <Unlock className="h-3 w-3" />
                                  ) : (
                                    <Lock className="h-3 w-3" />
                                  )}
                                  <span>
                                    {exhibitor.isStandConfigEnabled
                                      ? "Configuración Habilitada"
                                      : "Configuración Deshabilitada"}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 items-start">
                            <button
                              onClick={() => handleDisableExhibitor(exhibitor.user?._id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500 rounded-md transition-colors text-sm"
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4" />
                              <span>Revocar Permiso</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-dark-gray rounded-lg">
                    <AlertCircle className="h-12 w-12 mx-auto text-gray-light mb-4" />
                    <h3 className="text-xl font-bold mb-2">No hay exhibitors habilitados</h3>
                    <p className="text-gray-light mb-6">
                      No se encontraron exhibitors con permisos de configuración para este evento.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
