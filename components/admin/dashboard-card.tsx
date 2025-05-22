"use client"

import type { ReactNode } from "react"

interface DashboardCardProps {
  children: ReactNode
  className?: string
}

export default function DashboardCard({ children, className = "" }: DashboardCardProps) {
  return (
    <div
      className={`bg-dark-gray p-6 rounded-lg border border-transparent hover:border-gold/20 transition-all ${className}`}
    >
      {children}
    </div>
  )
}
