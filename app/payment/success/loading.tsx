import { Loader2 } from "lucide-react"

export default function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-rich-black text-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 mx-auto text-burgundy animate-spin mb-4" />
        <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
        <p className="text-gray-light">Please wait while we verify your payment status...</p>
      </div>
    </div>
  )
}
