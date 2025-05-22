"use client"

import React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import Link from "next/link"
import { forgotPassword } from "@/services/auth-service"

// Define el esquema de validación
const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  redirectPath?: string
  prefilledEmail?: string
}

export default function LoginModal({ isOpen, onClose, redirectPath = "/", prefilledEmail = "" }: LoginModalProps) {
  const { login } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const [loginEmail, setLoginEmail] = useState(prefilledEmail || "")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: prefilledEmail || "",
    },
  })

  // Actualizar el email en el formulario cuando cambia prefilledEmail
  React.useEffect(() => {
    if (prefilledEmail) {
      setLoginEmail(prefilledEmail)
      setValue("email", prefilledEmail)
    }
  }, [prefilledEmail, setValue])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await login(data.email, data.password)
      onClose()
      if (redirectPath) {
        router.push(redirectPath)
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotPasswordEmail) {
      setError("Por favor, introduce tu correo electrónico")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await forgotPassword(forgotPasswordEmail)
      setForgotPasswordSuccess(true)
    } catch (err: any) {
      setError(err.message || "Error al enviar el correo de recuperación")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    // Mostrar indicador de carga
    setIsLoading(true)

    // Construir la URL para la autenticación con Google
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
    const googleAuthUrl = `${apiUrl}/auth/google`

    console.log("Redirecting to Google Auth:", googleAuthUrl)

    // Redirigir al usuario a la URL de autenticación de Google
    window.location.href = googleAuthUrl
  }

  const handleShowForgotPassword = () => {
    setForgotPasswordEmail(loginEmail)
    setShowForgotPassword(true)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-rich-black p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-light hover:text-white"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>

        {!showForgotPassword ? (
          <>
            <h2 className="mb-6 text-center text-2xl font-cormorant font-light tracking-wider uppercase">Login</h2>

            {error && <div className="mb-4 rounded bg-red-900/50 p-3 text-red-200">{error}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-light">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  {...register("email", {
                    onChange: (e) => setLoginEmail(e.target.value),
                  })}
                  className="w-full rounded border border-gray-700 bg-dark-gray p-2 text-white"
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-light">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="w-full rounded border border-gray-700 bg-dark-gray p-2 text-white"
                  placeholder="********"
                />
                {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
              </div>

              <div className="flex justify-between">
                <button type="button" onClick={handleShowForgotPassword} className="text-sm text-gold hover:underline">
                  Forgot Password?
                </button>
                <Link href="/register" className="text-sm text-gold hover:underline">
                  Register
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded bg-burgundy py-2 text-white transition-colors hover:bg-burgundy/80 disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Submit"}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-rich-black px-2 text-gray-light">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center rounded border border-gray-700 bg-dark-gray py-2 text-white transition-colors hover:bg-dark-gray/80"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-6 text-center text-2xl font-cormorant font-light tracking-wider uppercase">
              Recover Password
            </h2>

            {error && <div className="mb-4 rounded bg-red-900/50 p-3 text-red-200">{error}</div>}

            {forgotPasswordSuccess ? (
              <div className="rounded bg-green-900/50 p-4 text-green-200">
                <p>An email with instructions to reset your password has been sent.</p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordSuccess(false)
                  }}
                  className="mt-4 w-full rounded bg-burgundy py-2 text-white transition-colors hover:bg-burgundy/80"
                >
                  Back
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="forgotEmail" className="mb-1 block text-sm font-medium text-gray-light">
                    Email
                  </label>
                  <input
                    id="forgotEmail"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full rounded border border-gray-700 bg-dark-gray p-2 text-white"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-sm text-gold hover:underline"
                  >
                    Back
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded bg-burgundy py-2 text-white transition-colors hover:bg-burgundy/80 disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Send recovery email"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
