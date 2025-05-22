"use client"

import type { ReactNode } from "react"

interface DashboardBadgeProps {
  children: ReactNode
  variant?: "default" | "success" | "danger" | "warning" | "info" | "gold"
  className?: string
  icon?: ReactNode
}

export default function DashboardBadge({ children, variant = "default", className = "", icon }: DashboardBadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "bg-green-900/20 text-green-500 border border-green-500/30"
      case "danger":
        return "bg-red-900/20 text-red-500 border border-red-500/30"
      case "warning":
        return "bg-yellow-900/20 text-yellow-500 border border-yellow-500/30"
      case "info":
        return "bg-blue-900/20 text-blue-400 border border-blue-500/30"
      case "gold":
        return "bg-gold/10 text-gold border border-gold/30"
      default:
        return "bg-gray-700/30 text-gray-light border border-gray-600/30"
    }
  }

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full inline-flex items-center gap-1 ${getVariantClasses()} ${className}`}
    >
      {icon && icon}
      {children}
    </span>
  )
}
