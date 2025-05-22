"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { getUserById } from "@/services/user-service"
import type { User } from "@/types/user"
import { Edit, ArrowLeft, UserX, Mail, Building, Briefcase, Flag, Calendar, Clock } from "lucide-react"
import { use } from "react"

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const userId = resolvedParams.id
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No token found")
        }

        const userData = await getUserById(userId, token)
        setUser(userData)
      } catch (err: any) {
        console.error("Error fetching user:", err)
        setError(err.message || "Error al cargar los datos del usuario")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />
        <div className="max-w-4xl mx-auto py-16 px-4">
          <div className="flex justify-center items-center h-64">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
            <span className="ml-4">Cargando datos del usuario...</span>
          </div>
        </div>
      </main>
    )
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />
        <div className="max-w-4xl mx-auto py-16 px-4">
          <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-8">
            <p className="text-white">{error || "No se pudo cargar el usuario"}</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-dark-gray hover:bg-dark-gray/80 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-dark-gray hover:bg-dark-gray/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold">Detalles del Usuario</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/admin/users/${user._id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Editar Usuario</span>
            </Link>
          </div>
        </div>

        <div className="bg-dark-gray rounded-lg overflow-hidden shadow-xl">
          {/* Cabecera del perfil */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="bg-burgundy/20 h-24 w-24 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-burgundy">
                  {user.firstName && user.lastName
                    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                    : user.username.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                </h2>
                <p className="text-gray-light">{user.email}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.isActive
                        ? "bg-green-900/20 text-green-500 border border-green-500/30"
                        : "bg-red-900/20 text-red-500 border border-red-500/30"
                    }`}
                  >
                    {user.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-gold/10 text-gold border border-gold/30 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Información personal */}
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <p className="text-gray-light text-sm mb-1">Nombre de usuario</p>
                  <div className="flex items-center gap-2">
                    <UserX className="h-5 w-5 text-burgundy" />
                    <p>{user.username}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-light text-sm mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-burgundy" />
                    <p>{user.email}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-light text-sm mb-1">Nombre completo</p>
                  <p>{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "No especificado"}</p>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <p className="text-gray-light text-sm mb-1">Cargo</p>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-burgundy" />
                    <p>{user.cargo || "No especificado"}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-light text-sm mb-1">Empresa</p>
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-burgundy" />
                    <p>{user.empresa || "No especificado"}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-light text-sm mb-1">País de residencia</p>
                  <div className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-burgundy" />
                    <p>{user.paisResidencia || "No especificado"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información de la cuenta */}
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Información de la Cuenta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <p className="text-gray-light text-sm mb-1">ID de usuario</p>
                  <p className="font-mono text-sm">{user._id}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-light text-sm mb-1">Rol</p>
                  <p className="capitalize">{user.role}</p>
                </div>
                {/* Añadir esta sección para mostrar el tipo de usuario */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-light mb-1">Tipo de Usuario</h3>
                  <p className="text-white">{user.userType === "exhibitor" ? "Exhibidor" : "Visitante"}</p>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Tipo de Usuario</h3>
                  <p className="text-gray-light">
                    {user.userType === "exhibitor" ? "Exhibidor" : "Visitante"}
                    {user.userType === "exhibitor" && " (Con acceso a webinars)"}
                  </p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-light text-sm mb-1">Estado</p>
                  <p>{user.isActive ? "Activo" : "Inactivo"}</p>
                </div>
              </div>
              <div>
                {user.createdAt && (
                  <div className="mb-4">
                    <p className="text-gray-light text-sm mb-1">Fecha de creación</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-burgundy" />
                      <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {user.updatedAt && (
                  <div className="mb-4">
                    <p className="text-gray-light text-sm mb-1">Última actualización</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-burgundy" />
                      <p>{new Date(user.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-start">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-dark-gray hover:bg-dark-gray/80 rounded-md transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </button>
        </div>
      </div>
    </main>
  )
}
