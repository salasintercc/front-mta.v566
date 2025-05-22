"use client"

interface DashboardLoadingProps {
  message?: string
  className?: string
}

export default function DashboardLoading({ message = "Cargando...", className = "" }: DashboardLoadingProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
      <p className="mt-4 text-gray-light">{message}</p>
    </div>
  )
}
