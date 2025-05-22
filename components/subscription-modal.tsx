"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubscribe?: () => void
  isProcessing?: boolean
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  onSubscribe,
  isProcessing = false,
}: SubscriptionModalProps) {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubscribe) {
      onSubscribe()
    } else {
      onClose()
    }
  }

  // Handle click outside to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-rich-black border border-dark-gray max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-light hover:text-white"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">{t("preview.subscribeToWebinar")}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-gray-light mb-1">
              {t("form.fullName")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-dark-gray text-white border border-dark-gray focus:border-gold focus:outline-none"
              required
              disabled={isProcessing}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-light mb-1">
              {t("form.email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-dark-gray text-white border border-dark-gray focus:border-gold focus:outline-none"
              required
              disabled={isProcessing}
            />
          </div>

          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 mr-2"
              required
              disabled={isProcessing}
            />
            <label htmlFor="terms" className="text-gray-light text-sm">
              {t("preview.acceptTerms")}
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-burgundy hover:bg-burgundy/90 text-white px-6 py-3 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!acceptTerms || isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="mr-2">{t("preview.processing")}</span>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              t("preview.confirmSubscription")
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
