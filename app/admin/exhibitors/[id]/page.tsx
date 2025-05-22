"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getStandOptionById, deleteStandOption } from "@/services/stand-option-service"
import type { StandOption, StandItem } from "@/services/stand-option-service"
import { getEventById } from "@/services/event-service"
import type { Event } from "@/services/event-service"

export default function StandOptionDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const standOptionId = Array.isArray(id) ? id[0] : id

  const [standOption, setStandOption] = useState<StandOption | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        // Obtener la opción de stand
        const standOptionData = await getStandOptionById(standOptionId, token)
        setStandOption(standOptionData)

        // Obtener el evento asociado
        const eventData = await getEventById(standOptionData.event, token)
        setEvent(eventData)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Error al cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [standOptionId])

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await deleteStandOption(standOptionId, token)
      router.push("/admin/dashboard?tab=exhibitors")
    } catch (err: any) {
      console.error("Error deleting stand option:", err)
      setError(err.message || "Error al eliminar la opción de stand")
    } finally {
      setIsDeleteModalOpen(false)
    }
  }

  const renderItemDetails = (item: StandItem) => {
    return (
      <div className="bg-rich-black p-4 rounded-md mb-4">
        <h3 className="font-medium text-lg mb-2">{item.label}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-light text-sm">Tipo:</p>
            <p className="capitalize">{item.type}</p>
          </div>
          <div>
            <p className="text-gray-light text-sm">Obligatorio:</p>
            <p>{item.required ? "Sí" : "No"}</p>
          </div>
          {item.type === "text" && item.inputPlaceholder && (
            <div>
              <p className="text-gray-light text-sm">Placeholder:</p>
              <p>{item.inputPlaceholder}</p>
            </div>
          )}
          {item.type === "select" && (
            <div>
              <p className="text-gray-light text-sm">Máximo de selecciones:</p>
              <p>{item.maxSelections || 1}</p>
            </div>
          )}
          {item.type === "image" && (
            <div>
              <p className="text-gray-light text-sm">Mostrar imagen:</p>
              <p>{item.showImage ? "Sí" : "No"}</p>
            </div>
          )}
        </div>

        {item.type === "select" && item.options && item.options.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Opciones disponibles:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {item.options.map((option, index) => (
                <div key={index} className="bg-dark-gray p-3">
                  <p>{option.label}</p>
                  {option.value && option.value !== option.label && (
                    <p className="text-sm text-gray-light">Valor: {option.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    )
  }

  if (!standOption) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Opción de stand no encontrada</h2>
        <button
          onClick={() => router.push("/admin/dashboard?tab=exhibitors")}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
        >
          Volver al dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Detalles de Opción de Stand</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push("/admin/dashboard?tab=exhibitors")}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={() => router.push(`/admin/exhibitors/${standOptionId}/edit`)}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="bg-dark-gray rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Información General</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-light text-sm">Nombre:</p>
                <p className="text-lg font-medium">{standOption.name}</p>
              </div>
              <div>
                <p className="text-gray-light text-sm">Descripción:</p>
                <p>{standOption.description || "No disponible"}</p>
              </div>
              <div>
                <p className="text-gray-light text-sm">Precio:</p>
                <p className="text-lg font-medium">{standOption.price} €</p>
              </div>
              <div>
                <p className="text-gray-light text-sm">Disponible:</p>
                <p>{standOption.available ? "Sí" : "No"}</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Evento Asociado</h2>
            {event ? (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-light text-sm">Nombre del evento:</p>
                  <p className="text-lg font-medium">{event.title}</p>
                </div>
                <div>
                  <p className="text-gray-light text-sm">Fecha:</p>
                  <p>
                    {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-light text-sm">Ubicación:</p>
                  <p>{event.location || "No disponible"}</p>
                </div>
              </div>
            ) : (
              <p>Información del evento no disponible</p>
            )}
          </div>
        </div>
      </div>

      {standOption.items && standOption.items.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Elementos del Stand</h2>
          <div className="space-y-4">
            {standOption.items.map((item, index) => (
              <div key={index}>{renderItemDetails(item)}</div>
            ))}
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-gray rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirmar eliminación</h2>
            <p className="mb-6">
              ¿Estás seguro de que deseas eliminar esta opción de stand? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
