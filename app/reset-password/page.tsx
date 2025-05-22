"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { resetPassword } from "@/services/auth-service"
import Link from "next/link"
import { ArrowLeft, Check, Loader2 } from "lucide-react"

// Define el esquema de validación para la nueva contraseña
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(64, "La contraseña no puede tener más de 64 caracteres")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
        message: "La contraseña debe tener al menos una mayúscula, una minúscula, un número y un símbolo",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    if (!token) {
      setError("Token de recuperación no encontrado. Por favor, solicita un nuevo enlace de recuperación.")
    }
  }, [token])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (success && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    } else if (success && countdown === 0) {
      router.push("/")
    }
    return () => clearTimeout(timer)
  }, [success, countdown, router])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError("Token de recuperación no encontrado")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await resetPassword(token, data.newPassword)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Error al restablecer la contraseña. El token puede haber expirado.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-rich-black p-4">
      <div className="w-full max-w-md rounded-lg bg-dark-gray p-8 shadow-lg">
        <Link href="/" className="mb-6 flex items-center text-gold hover:underline">
          <ArrowLeft size={16} className="mr-2" />
          Volver al inicio
        </Link>

        <h1 className="mb-6 text-center font-cormorant text-3xl font-light uppercase tracking-wider text-white">
          Restablecer Contraseña
        </h1>

        {error && (
          <div className="mb-6 rounded bg-red-900/50 p-4 text-red-200">
            <p>{error}</p>
          </div>
        )}

        {success ? (
          <div className="rounded bg-green-900/50 p-6 text-center text-green-200">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-700 p-2">
                <Check size={24} />
              </div>
            </div>
            <h2 className="mb-2 text-xl font-semibold">¡Contraseña actualizada!</h2>
            <p className="mb-4">Tu contraseña ha sido restablecida correctamente.</p>
            <p>
              Serás redirigido a la página de inicio en <span className="font-bold">{countdown}</span> segundos...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-gray-light">
                Nueva Contraseña
              </label>
              <input
                id="newPassword"
                type="password"
                {...register("newPassword")}
                className="w-full rounded border border-gray-700 bg-rich-black p-3 text-white"
                placeholder="********"
              />
              {errors.newPassword && <p className="mt-1 text-sm text-red-400">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-light">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                className="w-full rounded border border-gray-700 bg-rich-black p-3 text-white"
                placeholder="********"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded bg-burgundy py-3 font-medium text-white transition-colors hover:bg-burgundy/80 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  "Restablecer Contraseña"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
