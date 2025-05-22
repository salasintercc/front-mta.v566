"use client"

import type { ReactNode } from "react"

interface DashboardEmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export default function DashboardEmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: DashboardEmptyStateProps) {
  return (
    <div className={`text-center py-12 bg-dark-gray rounded-lg ${className}`}>
      <div className="mx-auto text-gray-light mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-light mb-6">{description}</p>
      {action && action}
    </div>
  )
}
