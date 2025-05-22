import { useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface PaymentStatusModalProps {
  onRedirect: (path: string) => void
  onSuccess?: () => void
  onError?: () => void
}

export function PaymentStatusModal({
  onRedirect,
  onSuccess,
  onError
}: PaymentStatusModalProps) {
  const { toast } = useToast()

  useEffect(() => {
    // Mostrar mensaje de éxito
    toast({
      title: '¡Pago en proceso!',
      description: 'Serás redirigido a tu dashboard.',
      variant: 'success'
    })

    // Redirigir al dashboard después de un breve momento
    const timer = setTimeout(() => {
      onRedirect('/users/dashboard')
      onSuccess?.()
    }, 2000)

    return () => clearTimeout(timer)
  }, [toast, onRedirect, onSuccess])

  return null
} 