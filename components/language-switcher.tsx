"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function LanguageSwitcher({ isMobile = false }) {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)
  const { language, setLanguage } = useLanguage()

  // Cierra el menú de idiomas cuando se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [langMenuRef])

  // Función para mostrar el idioma actual en formato abreviado
  const getLanguageDisplay = () => {
    switch (language) {
      case "es":
        return "Es"
      case "en":
        return "En"
      case "de":
        return "De"
      default:
        return "Es"
    }
  }

  // Función para cambiar el idioma y cerrar el menú
  const changeLanguage = (lang: "es" | "en" | "de") => {
    setLanguage(lang)
    setIsLangMenuOpen(false)
  }

  if (isMobile) {
    return (
      <div className="pt-2 border-t border-dark-gray">
        <p className="text-gray-light mb-2">Language</p>
        <div className="flex space-x-4">
          <button
            onClick={() => changeLanguage("es")}
            className={`${language === "es" ? "text-gold" : "text-white"} hover:text-gray-light transition-colors`}
          >
            ES
          </button>
          <button
            onClick={() => changeLanguage("en")}
            className={`${language === "en" ? "text-gold" : "text-white"} hover:text-gray-light transition-colors`}
          >
            EN
          </button>
          <button
            onClick={() => changeLanguage("de")}
            className={`${language === "de" ? "text-gold" : "text-white"} hover:text-gray-light transition-colors`}
          >
            DE
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" ref={langMenuRef}>
      <button
        className="flex items-center text-white hover:text-gray-light transition-colors"
        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
        aria-expanded={isLangMenuOpen}
        aria-haspopup="true"
      >
        {getLanguageDisplay()} <ChevronDown className="h-4 w-4 ml-1" />
      </button>
      {isLangMenuOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-dark-gray shadow-lg rounded-sm z-50">
          <button
            onClick={() => changeLanguage("es")}
            className={`block w-full text-left px-4 py-2 text-white hover:bg-burgundy transition-colors ${language === "es" ? "text-gold" : ""}`}
          >
            Español
          </button>
          <button
            onClick={() => changeLanguage("en")}
            className={`block w-full text-left px-4 py-2 text-white hover:bg-burgundy transition-colors ${language === "en" ? "text-gold" : ""}`}
          >
            English
          </button>
          <button
            onClick={() => changeLanguage("de")}
            className={`block w-full text-left px-4 py-2 text-white hover:bg-burgundy transition-colors ${language === "de" ? "text-gold" : ""}`}
          >
            Deutsch
          </button>
        </div>
      )}
    </div>
  )
}
