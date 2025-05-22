export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-rich-black p-4">
      <div className="w-full max-w-md rounded-lg bg-dark-gray p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-cormorant font-light tracking-wider uppercase text-white">
          Procesando autenticación
        </h1>
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-4 border-burgundy border-t-gold"></div>
        </div>
      </div>
    </div>
  )
}
