"use client"

import type { ReactNode } from "react"

interface DashboardModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export default function DashboardModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = "",
}: DashboardModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-rich-black/80 z-50 flex items-center justify-center">
      <div className={`bg-dark-gray rounded-lg p-8 max-w-md w-full ${className}`}>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="mb-6">{children}</div>
        {footer ? (
          footer
        ) : (
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md text-gray-light hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
