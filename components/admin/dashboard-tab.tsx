"use client"

import type React from "react"
import { useRouter } from "next/navigation"

interface DashboardTabProps {
  label: string
  value: string
  activeTab: string
  icon?: React.ReactNode
  baseUrl: string
}

export default function DashboardTab({ label, value, activeTab, icon, baseUrl }: DashboardTabProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`${baseUrl}?tab=${value}`)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
        activeTab === value ? "bg-burgundy text-white" : "hover:bg-burgundy/20"
      }`}
    >
      {icon && <span className="h-5 w-5">{icon}</span>}
      <span>{label}</span>
    </button>
  )
}
