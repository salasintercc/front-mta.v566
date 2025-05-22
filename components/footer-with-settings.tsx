"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useSiteSettings } from "@/services/site-settings-service"
import { useState } from "react"

export default function FooterWithSettings() {
  const { t, isLoaded } = useLanguage()
  const { settings, loading } = useSiteSettings()
  const [year, setYear] = useState(new Date().getFullYear())

  // No renderizar nada hasta que las traducciones estén cargadas
  if (!isLoaded || loading) {
    return null
  }

  // Extraer los enlaces de redes sociales
  const socialLinks = {
    facebook: settings.socialLinks?.[0] || "https://facebook.com/meetthearchitect",
    twitter: settings.socialLinks?.[1] || "https://twitter.com/meetarchitect",
    instagram: settings.socialLinks?.[2] || "https://instagram.com/meetthearchitect",
    linkedin: settings.socialLinks?.[3] || "https://linkedin.com/company/meetthearchitect",
  }

  return (
    <footer className="bg-dark-gray py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Logo and Info */}
          <div>
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/placeholder.svg?height=40&width=40&text=MTA"
                alt=""
                width={40}
                height={40}
                className="mr-2"
              />
              <span className="font-bold text-lg">{settings.appName}</span>
            </Link>
            <p className="text-gray-light mb-4">
              {settings.appDescription ||
                "Descubre los eventos arquitectónicos más exclusivos y conecta con profesionales del sector."}
            </p>
            <div className="flex space-x-4">
              <Link
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-white hover:text-gold transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-white hover:text-gold transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-white hover:text-gold transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-white hover:text-gold transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contacto</h3>
            <ul className="space-y-2">
              <li className="text-gray-light">
                Email:{" "}
                <Link href={`mailto:${settings.email}`} className="hover:text-gold transition-colors">
                  {settings.email}
                </Link>
              </li>
              <li className="text-gray-light">
                Teléfono:{" "}
                <Link href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-gold transition-colors">
                  {settings.phone}
                </Link>
              </li>
              <li className="text-gray-light">
                {settings.address.split(",").map((line, index) => (
                  <span key={index}>
                    {line.trim()}
                    {index < settings.address.split(",").length - 1 && <br />}
                  </span>
                ))}
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-bold mb-4">Newsletter</h3>
            <p className="text-gray-light mb-4">
              Suscríbete a nuestro boletín para recibir las últimas noticias y actualizaciones.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="w-full px-4 py-2 bg-rich-black text-white border border-dark-gray focus:border-gold focus:outline-none"
                required
              />
              <button
                type="submit"
                className="w-full bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 transition-colors"
              >
                Suscribirse
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-dark-gray text-center text-gray-light text-sm">
          <p>
            © {year} {settings.appName}. Todos los derechos reservados.
          </p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-gold transition-colors">
              Política de privacidad
            </Link>
            <Link href="/terms" className="hover:text-gold transition-colors">
              Términos y condiciones
            </Link>
            <Link href="/imprint" className="hover:text-gold transition-colors">
              Aviso legal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
