"use client"

import type { ReactNode } from "react"
import Link from "next/link"

interface DashboardButtonProps {
  children: ReactNode
  onClick?: () => void
  href?: string
  variant?: "primary" | "secondary" | "danger" | "success" | "warning" | "info"
  size?: "sm" | "md" | "lg"
  className?: string
  icon?: ReactNode
}

export default function DashboardButton({
  children,
  onClick,
  href,
  variant = "primary",
  size = "md",
  className = "",
  icon,
}: DashboardButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-burgundy hover:bg-burgundy/90 text-white"
      case "secondary":
        return "bg-dark-gray border border-gold/50 hover:bg-gold/10 text-gold"
      case "danger":
        return "bg-dark-gray border border-red-500/50 hover:bg-red-500/10 text-red-500"
      case "success":
        return "bg-dark-gray border border-green-500/50 hover:bg-green-500/10 text-green-500"
      case "warning":
        return "bg-dark-gray border border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-500"
      case "info":
        return "bg-dark-gray border border-blue-500/50 hover:bg-blue-500/10 text-blue-400"
      default:
        return "bg-burgundy hover:bg-burgundy/90 text-white"
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-sm"
      case "md":
        return "px-4 py-2"
      case "lg":
        return "px-6 py-3 text-lg"
      default:
        return "px-4 py-2"
    }
  }

  const buttonClasses = `${getVariantClasses()} ${getSizeClasses()} rounded-md transition-colors flex items-center gap-2 ${className}`

  if (href) {
    return (
      <Link href={href} className={buttonClasses}>
        {icon && icon}
        {children}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={buttonClasses}>
      {icon && icon}
      {children}
    </button>
  )
}
