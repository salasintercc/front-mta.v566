"use client"

import type React from "react"

interface SelectOption {
  value: string
  label: string
}

interface DashboardSelectProps {
  options: SelectOption[]
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  className?: string
}

export default function DashboardSelect({ options, value, onChange, className = "" }: DashboardSelectProps) {
  return (
    <select
      className={`px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gold ${className}`}
      value={value}
      onChange={onChange}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
