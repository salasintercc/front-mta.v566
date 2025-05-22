"use client"

// Este servicio maneja la configuración del sitio
import { useState, useEffect } from "react"
import { API_CONFIG } from "@/config/api"

// Definir la interfaz para la configuración del sitio
export interface SiteSettings {
  siteName?: string
  appName: string
  appDescription: string
  contactEmail?: string
  email: string
  phoneNumber?: string
  phone: string
  address: string
  socialLinks: string[]
  adminEmail: string
}

// Valores predeterminados
const defaultSettings: SiteSettings = {
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
}

// Función para obtener la configuración del sitio
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    // Obtener la URL base de la API
    const baseUrl = API_CONFIG.baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

    // Intentar obtener la configuración de la API
    const response = await fetch(`${baseUrl}/settings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Error al obtener la configuración")
    }

    const data = await response.json()

    // Mapear los campos del backend a los nombres de campo del frontend
    const frontendData = {
      ...defaultSettings, // Usar valores predeterminados como base
      ...data,
      appName: data.siteName || data.appName || defaultSettings.appName,
      email: data.contactEmail || data.email || defaultSettings.email,
      phone: data.phoneNumber || data.phone || defaultSettings.phone,
      // Asegurar que socialLinks sea siempre un array
      socialLinks: Array.isArray(data.socialLinks) ? data.socialLinks : defaultSettings.socialLinks,
    }

    return frontendData
  } catch (error) {
    console.error("Error al obtener la configuración del sitio:", error)

    // Si hay un error, intentar obtener del localStorage
    try {
      const storedSettings = localStorage.getItem("siteSettings")
      if (storedSettings) {
        return JSON.parse(storedSettings)
      }
    } catch (e) {
      console.error("Error al leer del localStorage:", e)
    }

    return defaultSettings
  }
}

// Función para guardar la configuración del sitio
export async function saveSiteSettings(settings: SiteSettings): Promise<boolean> {
  try {
    // Obtener la URL base de la API
    const baseUrl = API_CONFIG.baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"

    // Mapear los campos del frontend a los nombres de campo del backend
    const backendSettings = {
      ...settings,
      siteName: settings.appName,
      contactEmail: settings.email,
      phoneNumber: settings.phone,
    }

    // Guardar en la API
    const response = await fetch(`${baseUrl}/settings`, {
      method: "PUT", // Cambiado a PUT según el controlador
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Añadir token para autenticación
      },
      credentials: "include",
      body: JSON.stringify(backendSettings),
    })

    if (!response.ok) {
      throw new Error("Error al guardar la configuración")
    }

    // También guardar en localStorage como respaldo
    localStorage.setItem("siteSettings", JSON.stringify(settings))
    return true
  } catch (error) {
    console.error("Error al guardar la configuración del sitio:", error)
    return false
  }
}

// Hook personalizado para usar la configuración del sitio
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSiteSettings()
        setSettings(data)
        setError(null)
      } catch (err) {
        setError("Error al cargar la configuración")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const updateSettings = async (newSettings: SiteSettings) => {
    setLoading(true)
    try {
      const success = await saveSiteSettings(newSettings)
      if (success) {
        setSettings(newSettings)
        setError(null)
        return true
      } else {
        setError("Error al guardar la configuración")
        return false
      }
    } catch (err) {
      setError("Error al guardar la configuración")
      console.error(err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    settings,
    loading,
    error,
    updateSettings,
    fetchSettings: async () => {
      setLoading(true)
      try {
        const data = await getSiteSettings()
        setSettings(data)
        setError(null)
      } catch (err) {
        setError("Error al cargar la configuración")
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
  }
}
