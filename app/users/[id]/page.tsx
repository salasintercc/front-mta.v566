"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import AuthGuard from "@/components/route-guards/auth-guard"
import { getUserById, deleteUser } from "@/services/user-service"
import type { User } from "@/types/user"

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const { user: currentUser } = useAuth()
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")
        if (!token) {
          console.error("No token found in localStorage")
          // En lugar de lanzar un error, simplemente establecer un mensaje de error
          setError("No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.")
          setIsLoading(false)
          return
        }

        const userData = await getUserById(userId, token)
        setUserProfile(userData)
      } catch (err: any) {
        console.error("Error fetching user profile:", err)
        setError(err.message || "Error al cargar el perfil de usuario")
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchUserProfile()
    }
  }, [userId])

  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true)
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No token found")
      }

      await deleteUser(userId, token)

      // Redirigir a la lista de usuarios
      router.push("/users")
    } catch (err: any) {
      console.error("Error deleting user:", err)
      setError(err.message || "Error al eliminar el usuario")
      setIsDeleting(false)
    }
  }

  return (
    <AuthGuard requiredRole="user" allowSelfAccess={true} userId={userId}>
      <main className="min-h-screen bg-rich-black text-white pt-20">
        <Navbar />

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold">Perfil de Usuario</h1>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
                <p className="mt-4">Cargando perfil...</p>
              </div>
            ) : error ? (
              <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md">
                <p className="text-white">{error}</p>
              </div>
            ) : userProfile ? (
              <div className="bg-dark-gray p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Información Personal</h2>
                    <div className="space-y-3">
                      {userProfile.picture && (
                        <div className="mb-4">
                          <img
                            src={userProfile.picture || "/placeholder.svg"}
                            alt={`Foto de ${userProfile.username}`}
                            className="w-24 h-24 rounded-full object-cover border-2 border-gold"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-gray-light text-sm">Nombre de usuario</p>
                        <p className="font-medium">{userProfile.username}</p>
                      </div>
                      {(userProfile.firstName || userProfile.lastName) && (
                        <div>
                          <p className="text-gray-light text-sm">Nombre completo</p>
                          <p className="font-medium">
                            {`${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim()}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-light text-sm">Correo electrónico</p>
                        <p className="font-medium">{userProfile.email}</p>
                      </div>
                      {userProfile.paisResidencia && (
                        <div>
                          <p className="text-gray-light text-sm">País de Residencia</p>
                          <p className="font-medium">{userProfile.paisResidencia}</p>
                        </div>
                      )}
                      {userProfile.cargo && (
                        <div>
                          <p className="text-gray-light text-sm">Cargo</p>
                          <p className="font-medium">{userProfile.cargo}</p>
                        </div>
                      )}
                      {userProfile.empresa && (
                        <div>
                          <p className="text-gray-light text-sm">Empresa</p>
                          <p className="font-medium">{userProfile.empresa}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-4">Información de Cuenta</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-light text-sm">Rol</p>
                        <p className="font-medium capitalize">{userProfile.role}</p>
                      </div>
                      <div>
                        <p className="text-gray-light text-sm">Estado</p>
                        <p className="font-medium">
                          {userProfile.isActive ? (
                            <span className="text-green-500">Activo</span>
                          ) : (
                            <span className="text-red-500">Inactivo</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-light text-sm">Tipo de cuenta</p>
                        <p className="font-medium capitalize">
                          {userProfile.provider === "google" ? (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                  fill="#4285F4"
                                />
                                <path
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                  fill="#34A853"
                                />
                                <path
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                  fill="#FBBC05"
                                />
                                <path
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                  fill="#EA4335"
                                />
                              </svg>
                              Google
                            </span>
                          ) : (
                            "Local"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-light text-sm">Perfil completo</p>
                        <p className="font-medium">
                          {userProfile.isProfileCompleted ? (
                            <span className="text-green-500">Completo</span>
                          ) : (
                            <span className="text-yellow-500">Incompleto</span>
                          )}
                        </p>
                      </div>
                      {userProfile.createdAt && (
                        <div>
                          <p className="text-gray-light text-sm">Fecha de registro</p>
                          <p className="font-medium">
                            {new Date(userProfile.createdAt).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mostrar botones de edición solo si es el propio usuario o un administrador */}
                {(currentUser?.id === userId || currentUser?.role === "admin") && (
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                      href={`/users/${userId}/edit`}
                      className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Editar Perfil
                    </Link>

                    {currentUser?.id === userId && userProfile.provider !== "google" && (
                      <Link
                        href={`/users/${userId}/change-password`}
                        className="bg-dark-gray border border-burgundy hover:bg-burgundy/20 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        Cambiar Contraseña
                      </Link>
                    )}

                    {currentUser?.role === "admin" && (
                      <>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          Eliminar Usuario
                        </button>
                        <Link
                          href="/admin/dashboard"
                          className="bg-dark-gray border border-gold hover:bg-gold/10 text-gold px-4 py-2 rounded-md transition-colors"
                        >
                          Volver al Panel de Administración
                        </Link>
                      </>
                    )}
                  </div>
                )}

                {/* Modal de confirmación para eliminar usuario */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-gray p-6 rounded-lg max-w-md w-full">
                      <h3 className="text-xl font-bold mb-4">Confirmar eliminación</h3>
                      <p className="mb-6">
                        ¿Estás seguro de que deseas eliminar al usuario <strong>{userProfile.username}</strong>? Esta
                        acción no se puede deshacer.
                      </p>
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="bg-dark-gray border border-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleDeleteUser}
                          disabled={isDeleting}
                          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-dark-gray p-6 rounded-lg">
                <p className="text-center">No se encontró el perfil de usuario</p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </AuthGuard>
  )
}
