"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import translations from "@/translations"

type Language = "es" | "en" | "de"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isLoaded: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Estado para controlar si las traducciones están cargadas
  const [isLoaded, setIsLoaded] = useState(false)
  // Iniciar con español como idioma predeterminado
  const [language, setLanguage] = useState<Language>("es")

  // Cargar el idioma guardado cuando el componente se monta
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== "undefined") {
      try {
        const savedLanguage = localStorage.getItem("language") as Language
        if (savedLanguage && ["es", "en", "de"].includes(savedLanguage)) {
          setLanguage(savedLanguage)
        }
      } catch (error) {
        console.error("Error accessing localStorage:", error)
      } finally {
        // Marcar como cargado incluso si hay un error
        setIsLoaded(true)
      }
    } else {
      // Si estamos en el servidor, marcar como cargado para evitar problemas de hidratación
      setIsLoaded(true)
    }
  }, [])

  // Guardar el idioma seleccionado en localStorage cuando cambia
  useEffect(() => {
    if (typeof window !== "undefined" && isLoaded) {
      try {
        localStorage.setItem("language", language)
      } catch (error) {
        console.error("Error saving language to localStorage:", error)
      }
    }
  }, [language, isLoaded])

  // Función para cambiar el idioma
  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  // Función para obtener una traducción
  const t = (key: string): string => {
    // Si la clave no existe en el idioma actual, intentar con español como fallback
    if (!translations[language][key]) {
      console.warn(`Translation key "${key}" not found in language "${language}". Using fallback.`)
      return translations.es[key] || key
    }
    return translations[language][key]
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  )
}

// Hook personalizado para usar el contexto de idioma
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
