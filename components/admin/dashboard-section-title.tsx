"use client"

import type { ReactNode } from "react"

interface DashboardSectionTitleProps {
  title: string
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}

export default function DashboardSectionTitle({ title, icon, actions, className = "" }: DashboardSectionTitleProps) {
  return (
    <div className={`flex justify-between items-center mb-6 ${className}`}>
      <h2 className="text-2xl font-bold flex items-center gap-2">
        {icon && <span className="text-burgundy">{icon}</span>}
        <span>{title}</span>
      </h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
