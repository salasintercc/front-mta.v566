"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"
import { useSiteSettings } from "@/services/site-settings-service"
import { useEffect, useState } from "react"

export default function Footer() {
  const { settings, loading } = useSiteSettings()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient || loading) {
    return (
      <footer className="bg-rich-black text-white py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-gray rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="h-6 bg-dark-gray rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-dark-gray rounded w-full"></div>
                  <div className="h-4 bg-dark-gray rounded w-3/4"></div>
                  <div className="h-4 bg-dark-gray rounded w-5/6"></div>
                </div>
              </div>
              <div>
                <div className="h-6 bg-dark-gray rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-dark-gray rounded w-full"></div>
                  <div className="h-4 bg-dark-gray rounded w-3/4"></div>
                  <div className="h-4 bg-dark-gray rounded w-5/6"></div>
                </div>
              </div>
              <div>
                <div className="h-6 bg-dark-gray rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-dark-gray rounded w-full"></div>
                  <div className="h-4 bg-dark-gray rounded w-3/4"></div>
                  <div className="h-4 bg-dark-gray rounded w-5/6"></div>
                </div>
              </div>
              <div>
                <div className="h-6 bg-dark-gray rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-dark-gray rounded w-full"></div>
                  <div className="h-4 bg-dark-gray rounded w-3/4"></div>
                  <div className="h-4 bg-dark-gray rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  // Extraer los enlaces de redes sociales con valores predeterminados
  const socialLinks = {
    facebook: settings.socialLinks?.[0] || "https://facebook.com/meetthearchitect",
    twitter: settings.socialLinks?.[1] || "https://twitter.com/meetarchitect",
    instagram: settings.socialLinks?.[2] || "https://instagram.com/meetthearchitect",
    linkedin: settings.socialLinks?.[3] || "https://linkedin.com/company/meetthearchitect",
  }

  return (
    <footer className="bg-rich-black text-white py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Columna 1: Información de la empresa */}
          <div>
            <h3 className="text-xl font-bold mb-4">{settings.appName}</h3>
            <p className="text-gray-light mb-4">{settings.appDescription}</p>
            <div className="flex space-x-4">
              {settings.socialLinks && settings.socialLinks.length > 0 ? (
                <>
                  {settings.socialLinks.map((url, index) => {
                    // Determinar qué icono mostrar basado en la URL
                    if (url.includes("facebook.com")) {
                      return (
                        <Link
                          key={`social-${index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Facebook"
                        >
                          <Facebook className="h-5 w-5 text-gray-light hover:text-gold transition-colors" />
                        </Link>
                      )
                    } else if (url.includes("twitter.com") || url.includes("x.com")) {
                      return (
                        <Link
                          key={`social-${index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Twitter"
                        >
                          <Twitter className="h-5 w-5 text-gray-light hover:text-gold transition-colors" />
                        </Link>
                      )
                    } else if (url.includes("instagram.com")) {
                      return (
                        <Link
                          key={`social-${index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Instagram"
                        >
                          <Instagram className="h-5 w-5 text-gray-light hover:text-gold transition-colors" />
                        </Link>
                      )
                    } else if (url.includes("linkedin.com")) {
                      return (
                        <Link
                          key={`social-${index}`}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="h-5 w-5 text-gray-light hover:text-gold transition-colors" />
                        </Link>
                      )
                    }
                    return null
                  })}
                </>
              ) : (
                <>
                  <Link
                    href="https://instagram.com/meetthearchitect"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5 text-gray-light hover:text-gold transition-colors" />
                  </Link>
                  <Link
                    href="https://linkedin.com/company/meetthearchitect"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5 text-gray-light hover:text-gold transition-colors" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Columna 2: Enlaces rápidos */}
          <div>
            <h3 className="text-xl font-bold mb-4">Enlaces rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="text-gray-light hover:text-gold transition-colors">
                  Eventos
                </Link>
              </li>
              <li>
                <Link href="/webinars" className="text-gray-light hover:text-gold transition-colors">
                  Webinars
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-light hover:text-gold transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-light hover:text-gold transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Información legal */}
          <div>
            <h3 className="text-xl font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy" className="text-gray-light hover:text-gold transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-gray-light hover:text-gold transition-colors">
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link href="/cookies-policy" className="text-gray-light hover:text-gold transition-colors">
                  Política de cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-gold mr-2 mt-1" />
                <span className="text-gray-light">
                  {settings.address.split(",").map((line, index) => (
                    <span key={index}>
                      {line.trim()}
                      {index < settings.address.split(",").length - 1 && <br />}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-gold mr-2" />
                <Link
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="text-gray-light hover:text-gold transition-colors"
                >
                  {settings.phone}
                </Link>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-gold mr-2" />
                <Link href={`mailto:${settings.email}`} className="text-gray-light hover:text-gold transition-colors">
                  {settings.email}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-gray mt-8 pt-8 text-center text-gray-light">
          <p>
            &copy; {new Date().getFullYear()} {settings.appName}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
