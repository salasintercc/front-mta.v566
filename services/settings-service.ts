"use client"

import { get, put } from "@/utils/api"
import { API_CONFIG } from "@/utils/api-config"
import { useState } from "react"

// Update the Settings interface to include faqs and organizers
export interface Settings {
  appName: string
  appDescription: string
  email: string
  phone: string
  address: string
  socialLinks: string[]
  adminEmail: string
  // Add these fields to match the backend DTO
  siteName?: string
  contactEmail?: string
  phoneNumber?: string
  // Add new fields for FAQs and organizers
  faqs?: FAQ[]
  organizers?: Organizer[]
}

// Add new interfaces for FAQ and Organizer
export interface FAQ {
  question: string
  answer: string
}

export interface Organizer {
  name: string
  email: string
  phone?: string
  bio?: string
  country?: string
  position?: string
  photo?: string
}

// Update the default settings to include empty arrays for faqs and organizers
const defaultSettings: Settings = {
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
  // Add these with the same values to ensure compatibility
  siteName: "Meet the Architect",
  contactEmail: "info@meetthearchitect.com",
  phoneNumber: "+34 123 456 789",
  // Initialize empty arrays for faqs and organizers
  faqs: [],
  organizers: [],
}

// Función para obtener la configuración del sitio
export async function getSettings(token: string): Promise<Settings> {
  try {
    const response = await get<Settings>(API_CONFIG.endpoints.siteSettings, token)
    return response
  } catch (error) {
    console.error("Error al obtener la configuración del sitio:", error)
    return defaultSettings
  }
}

// Función para guardar la configuración del sitio
export async function updateSettings(settings: Settings, token: string): Promise<Settings> {
  try {
    // Map frontend fields to backend DTO fields
    const backendSettings = {
      ...settings,
      // Ensure these fields are set for the backend
      siteName: settings.appName,
      contactEmail: settings.email,
      phoneNumber: settings.phone,
    }

    const response = await put<Settings>(API_CONFIG.endpoints.siteSettings, backendSettings, token)
    return response
  } catch (error) {
    console.error("Error al guardar la configuración del sitio:", error)
    throw error
  }
}

// Hook personalizado para usar la configuración del sitio
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      const data = await getSettings(token)
      // Map backend fields to frontend fields
      const frontendData = {
        ...defaultSettings, // Use defaults as base
        ...Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined)),
        // Map specific fields
        appName: data.siteName || data.appName || defaultSettings.appName,
        email: data.contactEmail || data.email || defaultSettings.email,
        phone: data.phoneNumber || data.phone || defaultSettings.phone,
      }

      // Ensure socialLinks is always an array
      if (!frontendData.socialLinks || !Array.isArray(frontendData.socialLinks)) {
        frontendData.socialLinks = []
      }

      setSettings(frontendData)
      setError(null)
      return frontendData
    } catch (err: any) {
      setError("Error al cargar la configuración: " + (err.message || "Error desconocido"))
      console.error(err)
      return defaultSettings
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (newSettings: Settings) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      // Sanitize settings before sending to API
      const sanitizedSettings = {
        ...defaultSettings,
        ...Object.fromEntries(Object.entries(newSettings).filter(([_, value]) => value !== undefined)),
        // Ensure backend field names are set
        siteName: newSettings.appName || defaultSettings.appName,
        contactEmail: newSettings.email || defaultSettings.email,
        phoneNumber: newSettings.phone || defaultSettings.phone,
      }

      // Ensure socialLinks is always an array
      if (!sanitizedSettings.socialLinks || !Array.isArray(sanitizedSettings.socialLinks)) {
        sanitizedSettings.socialLinks = []
      }

      const updatedSettings = await updateSettings(sanitizedSettings, token)

      // Map the response back to frontend fields
      const frontendSettings = {
        ...updatedSettings,
        appName: updatedSettings.siteName || updatedSettings.appName || defaultSettings.appName,
        email: updatedSettings.contactEmail || updatedSettings.email || defaultSettings.email,
        phone: updatedSettings.phoneNumber || updatedSettings.phone || defaultSettings.phone,
      }

      setSettings(frontendSettings)
      setError(null)
      return true
    } catch (err: any) {
      setError("Error al guardar la configuración: " + (err.message || "Error desconocido"))
      console.error(err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { settings, loading, error, fetchSettings, saveSettings }
}
