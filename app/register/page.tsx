"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { countries } from "@/utils/countries"
import { Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const { t, isLoaded } = useLanguage()
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    cargo: "",
    empresa: "",
    paisResidencia: "",
    firstName: "",
    lastName: "",
    role: "user", // Por defecto, los usuarios son visitantes (role: user)
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  useEffect(() => {
    // Si el usuario ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
      router.push("/users/dashboard")
    }
  }, [isAuthenticated, router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validar nombre de usuario
    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es obligatorio"
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido"
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria"
    } else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(formData.password)) {
      newErrors.password = "La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un símbolo"
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.cargo,
        formData.empresa,
        formData.paisResidencia,
        formData.firstName,
        formData.lastName,
        formData.role,
      )
      // Redirigir al dashboard después del registro exitoso
      router.push("/users/dashboard")
    } catch (error: any) {
      console.error("Error en el registro:", error)
      setGeneralError(error.message || "Error al registrarse. Por favor, inténtelo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) {
    return null
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <section className="py-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Crear una cuenta</h1>
            <p className="text-gray-light">
              Únete a nuestra comunidad para acceder a eventos exclusivos y contenido premium.
            </p>
          </div>

          {generalError && (
            <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6">
              <p className="text-white">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-dark-gray p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información básica */}
              <div className="md:col-span-2">
                <h2 className="text-xl font-bold mb-4">Información básica</h2>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  Nombre de usuario *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full bg-rich-black border ${
                    errors.username ? "border-burgundy" : "border-gray-700"
                  } rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy`}
                />
                {errors.username && <p className="text-burgundy text-sm mt-1">{errors.username}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-rich-black border ${
                    errors.email ? "border-burgundy" : "border-gray-700"
                  } rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy`}
                />
                {errors.email && <p className="text-burgundy text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full bg-rich-black border ${
                      errors.password ? "border-burgundy" : "border-gray-700"
                    } rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-burgundy text-sm mt-1">{errors.password}</p>}
                <p className="text-xs text-gray-light mt-1">
                  Mínimo 8 caracteres, incluyendo al menos una letra mayúscula, un número y un carácter especial.
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirmar contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full bg-rich-black border ${
                      errors.confirmPassword ? "border-burgundy" : "border-gray-700"
                    } rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-burgundy text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Información profesional */}
              <div className="md:col-span-2 mt-4">
                <h2 className="text-xl font-bold mb-4">Información profesional</h2>
              </div>

              <div>
                <label htmlFor="cargo" className="block text-sm font-medium mb-2">
                  Cargo
                </label>
                <input
                  type="text"
                  id="cargo"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                />
              </div>

              <div>
                <label htmlFor="empresa" className="block text-sm font-medium mb-2">
                  Empresa
                </label>
                <input
                  type="text"
                  id="empresa"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                />
              </div>

              <div>
                <label htmlFor="paisResidencia" className="block text-sm font-medium mb-2">
                  País de Residencia
                </label>
                <select
                  id="paisResidencia"
                  name="paisResidencia"
                  value={formData.paisResidencia}
                  onChange={handleChange}
                  className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                >
                  <option value="">Selecciona un país</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-2">
                  Tipo de usuario
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-rich-black border border-gray-700 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-burgundy"
                >
                  <option value="user">Visitante</option>
                  <option value="exhibitor">Exhibidor</option>
                </select>
                <p className="text-xs text-gray-light mt-1">
                  Los exhibidores tienen acceso a webinars exclusivos y funcionalidades adicionales.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-burgundy hover:bg-burgundy/90 text-white px-4 py-3 rounded-md transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Registrando..." : "Registrarse"}
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-gray-light">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="text-gold hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  )
}
