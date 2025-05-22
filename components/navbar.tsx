"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, User } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import LanguageSwitcher from "./language-switcher"
import LoginModal from "./auth/login-modal"

// Componente memoizado para enlaces de navegación
const NavLink = React.memo(({ href, isActive, onClick, children }) => {
  return (
    <Link href={href} className={`nav-link ${isActive ? "active" : ""}`} onClick={onClick}>
      {children}
    </Link>
  )
})

NavLink.displayName = "NavLink"

// Componente memoizado para botones de navegación
const NavButton = React.memo(({ onClick, isActive, children }) => {
  return (
    <button onClick={onClick} className={`nav-link ${isActive ? "active" : ""}`}>
      {children}
    </button>
  )
})

NavButton.displayName = "NavButton"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginRedirectPath, setLoginRedirectPath] = useState<string | undefined>(undefined)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { t, isLoaded } = useLanguage()
  const { isAuthenticated, user, logout, canAccessWebinars } = useAuth()
  const [isClient, setIsClient] = useState(false)

  // Initialize pathname and router outside of conditional block
  const pathname = usePathname() || ""
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  // Función para cerrar el menú móvil
  const closeMenu = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false)
    }
  }

  // Función para manejar la navegación protegida
  const handleProtectedNavigation = useCallback(
    (path: string) => {
      // Si el usuario ya está autenticado, usar el router para navegar
      if (isAuthenticated) {
        router.push(path)
      } else {
        // Si no está autenticado, mostrar el modal de login con la ruta de redirección
        setLoginRedirectPath(path)
        setIsLoginModalOpen(true)
      }
    },
    [isAuthenticated, router],
  )

  // Ensure page scrolls to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Cerrar el menú de usuario cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest(".user-menu-container")) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isUserMenuOpen])

  // Define checkIsLinkActive outside of any conditional blocks
  const checkIsLinkActive = useCallback(
    (path: string): boolean => {
      if (path === "/") {
        return pathname === "/"
      }
      return pathname.startsWith(path)
    },
    [pathname],
  )

  // Don't render anything until translations are loaded
  if (!isLoaded) {
    return null
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-rich-black/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo - Enlace directo al home */}
            <Link href="/" className="flex items-center" onClick={closeMenu}>
              <span className="sr-only">Meet the Architect</span>
              <Image
                src="/placeholder.svg?height=40&width=40&text=MTA"
                alt=""
                width={40}
                height={40}
                className="mr-2"
              />
              <span className="font-cormorant text-lg hidden sm:inline-block tracking-widest uppercase">
                Meet the Architect
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {/* Mostrar enlace de Webinars si el usuario puede acceder (exhibidor o admin) */}
              {canAccessWebinars && (
                <NavButton
                  onClick={() => handleProtectedNavigation("/webinars")}
                  isActive={checkIsLinkActive("/webinars")}
                >
                  Webinars
                </NavButton>
              )}

              {/* Enlaces protegidos - con verificación de autenticación */}
              <NavButton onClick={() => handleProtectedNavigation("/events")} isActive={checkIsLinkActive("/events")}>
                Eventos
              </NavButton>

              <NavLink href="/blog" isActive={checkIsLinkActive("/blog")} onClick={closeMenu}>
                Blog
              </NavLink>

              <NavLink href="/contact" isActive={checkIsLinkActive("/contact")} onClick={closeMenu}>
                Contacto
              </NavLink>

              {/* Language Switcher Component */}
              <LanguageSwitcher />

              {/* Auth Button */}
              {isAuthenticated ? (
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="nav-link flex items-center mr-4"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>{user?.firstName || user?.email.split("@")[0]}</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-gray shadow-lg z-50 border border-white/10">
                      <Link
                        href={user?.role === "admin" ? "/admin/dashboard" : "/users/dashboard"}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block w-full text-left px-4 py-2 text-white hover:text-gold transition-colors text-sm"
                      >
                        {user?.role === "admin" ? "Panel de Administración" : "Panel de Control"}
                      </Link>
                      <div className="border-t border-white/10"></div>
                      <button
                        onClick={() => {
                          logout()
                          window.location.href = "/"
                          setIsUserMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-white hover:text-gold transition-colors text-sm"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setIsLoginModalOpen(true)} className="nav-link mr-4">
                  Login-Signup
                </button>
              )}
            </nav>

            {/* Ticket Button */}
            <Link
              href="/tickets"
              className={`hidden md:block px-6 py-2 nav-button ${checkIsLinkActive("/tickets") ? "active" : ""}`}
            >
              Reserva de tickets
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden text-white"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-rich-black border-t border-white/10">
            <div className="px-4 py-6 space-y-4">
              <Link
                href="/"
                className={`flex items-center text-white hover:text-gold transition-colors text-sm tracking-wider uppercase ${checkIsLinkActive("/") ? "active" : ""}`}
                onClick={closeMenu}
              >
                Meet the Architect
              </Link>

              {/* Mostrar enlace de Webinars si el usuario puede acceder (exhibidor o admin) */}
              {canAccessWebinars && (
                <button
                  onClick={() => handleProtectedNavigation("/webinars")}
                  className={`block w-full text-left text-white hover:text-gold transition-colors text-sm tracking-wider uppercase ${checkIsLinkActive("/webinars") ? "active" : ""}`}
                >
                  Webinars
                </button>
              )}

              <button
                onClick={() => handleProtectedNavigation("/events")}
                className={`block w-full text-left text-white hover:text-gold transition-colors text-sm tracking-wider uppercase ${checkIsLinkActive("/events") ? "active" : ""}`}
              >
                Eventos
              </button>

              <Link
                href="/blog"
                className={`block text-white hover:text-gold transition-colors text-sm tracking-wider uppercase ${checkIsLinkActive("/blog") ? "active" : ""}`}
                onClick={closeMenu}
              >
                Blog
              </Link>

              <Link
                href="/contact"
                className={`block text-white hover:text-gold transition-colors text-sm tracking-wider uppercase ${checkIsLinkActive("/contact") ? "active" : ""}`}
                onClick={closeMenu}
              >
                Contacto
              </Link>

              {/* Mobile Language Switcher */}
              <LanguageSwitcher isMobile={true} />

              {/* Auth Button */}
              {isAuthenticated ? (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-gray-light mb-2 text-sm">
                    <User className="h-4 w-4 inline mr-2" />
                    {user?.firstName || user?.username}
                  </p>
                  <p className="text-gray-light mb-2 text-sm">{user?.email}</p>
                  <div className="flex flex-col space-y-2 mt-2">
                    <Link
                      href={user?.role === "admin" ? "/admin/dashboard" : "/users/dashboard"}
                      onClick={closeMenu}
                      className="text-white hover:text-gold transition-colors text-sm tracking-wider uppercase"
                    >
                      {user?.role === "admin" ? "Panel de Administración" : "Panel de Control"}
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        window.location.href = "/"
                      }}
                      className="text-white hover:text-gold transition-colors text-sm tracking-wider uppercase"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="block text-white hover:text-gold transition-colors text-sm tracking-wider uppercase"
                >
                  Login-Signup
                </button>
              )}

              <Link
                href="/tickets"
                className={`block border border-gold/50 hover:border-gold text-white px-6 py-2 text-center transition-colors text-sm tracking-wider uppercase ${checkIsLinkActive("/tickets") ? "active" : ""}`}
                onClick={closeMenu}
              >
                Reserva de tickets
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Login Modal - will automatically redirect to the specified path */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectPath={loginRedirectPath}
      />
    </>
  )
}
