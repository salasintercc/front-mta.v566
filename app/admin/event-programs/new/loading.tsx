export default function Loading() {
  return (
    <div className="min-h-screen bg-rich-black text-white pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="h-10 w-64 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
          <p className="mt-4 text-gray-light">Cargando...</p>
        </div>
      </div>
    </div>
  )
}
