"use client"

interface DashboardPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemCount: number
  itemName?: string
  className?: string
}

export default function DashboardPagination({
  currentPage,
  totalPages,
  onPageChange,
  itemCount,
  itemName = "elementos",
  className = "",
}: DashboardPaginationProps) {
  return (
    <div className={`mt-6 flex justify-between items-center ${className}`}>
      <p className="text-sm text-gray-light">
        Mostrando <span className="font-medium">{itemCount}</span> {itemName}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1 bg-rich-black border border-gray-700 rounded-md hover:bg-dark-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 bg-rich-black border border-gray-700 rounded-md hover:bg-dark-gray transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
