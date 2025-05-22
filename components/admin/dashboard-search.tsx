"use client"

import type React from "react"
import { Search } from "lucide-react"

interface DashboardSearchProps {
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}

export default function DashboardSearch({ placeholder, value, onChange, className = "" }: DashboardSearchProps) {
  return (
    <div className={`relative flex-grow ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-light" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
        value={value}
        onChange={onChange}
      />
    </div>
  )
}
