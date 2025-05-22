"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem("cookieConsent")
    if (!hasConsented) {
      setIsVisible(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-rich-black border-t border-dark-gray p-4 md:p-6 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-white mb-2">{t("cookie.message")}</p>
          <p className="text-sm text-gray-light">
            {t("cookie.policy")}{" "}
            <Link href="/privacy" className="text-gold hover:underline">
              {t("cookie.policy")}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={acceptCookies}
            className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 transition-colors"
          >
            {t("cookie.accept")}
          </button>
          <button onClick={() => setIsVisible(false)} className="text-white" aria-label="Cerrar aviso de cookies">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
