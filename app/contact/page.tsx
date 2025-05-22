"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Phone, MapPin, Send, AlertCircle, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import LoadingScreen from "@/components/loading-screen"
import { useLanguage } from "@/contexts/language-context"
import OtherEvents from "@/components/home/other-events"
import { sendContactMessage } from "@/services/contact-service"
import SuccessModal from "@/components/success-modal"
import { useSiteSettings } from "@/services/site-settings-service"
// Importar la utilidad de mapas al principio del archivo (después de los imports existentes)
import { generateGoogleMapsUrl } from "@/utils/map-utils"

export default function ContactPage() {
  const router = useRouter()
  const { t, isLoaded } = useLanguage()
  const { settings, loading: settingsLoading } = useSiteSettings()
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  // Estado para el formulario de contacto
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    inquiryType: "",
    message: "",
    cargo: "",
    empresa: "",
  })

  // Estados para el manejo del envío
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Estado para el modal de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Estado para el checkbox de privacidad
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  // Estados para el formulario de evento personalizado
  const [customEventFormData, setCustomEventFormData] = useState({
    name: "",
    email: "",
    organization: "",
    eventDescription: "",
  })
  const [customEventPrivacyAccepted, setCustomEventPrivacyAccepted] = useState(false)
  const [customEventSuccess, setCustomEventSuccess] = useState(false)
  const [customEventError, setCustomEventError] = useState<string | null>(null)
  const [isSubmittingCustomEvent, setIsSubmittingCustomEvent] = useState(false)

  useEffect(() => {
    if (isLoaded && !settingsLoading) {
      setIsPageLoaded(true)
    }
  }, [isLoaded, settingsLoading])

  // Manejar cambios en el formulario principal
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Enviar el formulario principal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que se aceptó la política de privacidad
    if (!privacyAccepted) {
      setSubmitError("Debes aceptar la política de privacidad para enviar el formulario")
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      // Enviar los datos a la API
      await sendContactMessage(formData)

      // Limpiar el formulario
      setFormData({
        name: "",
        email: "",
        subject: "",
        inquiryType: "",
        message: "",
        cargo: "",
        empresa: "",
      })

      // Resetear el checkbox de privacidad
      setPrivacyAccepted(false)

      // Mostrar el modal de éxito
      setShowSuccessModal(true)

      // El modal se encargará de la redirección después de 2 segundos
    } catch (error: any) {
      console.error("Error al enviar el formulario:", error)
      setSubmitError(error.message || "Hubo un error al enviar tu mensaje. Por favor, inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isPageLoaded) {
    return <LoadingScreen />
  }

  // Extraer los enlaces de redes sociales con valores predeterminados
  const socialLinks = {
    facebook: settings.socialLinks?.[0] || "https://facebook.com/meetthearchitect",
    twitter: settings.socialLinks?.[1] || "https://twitter.com/meetarchitect",
    instagram: settings.socialLinks?.[2] || "https://instagram.com/meetthearchitect",
    linkedin: settings.socialLinks?.[3] || "https://linkedin.com/company/meetthearchitect",
  }

  // Asegurar que phone tiene un valor para evitar errores
  const phoneNumber = settings.phone || "+34 123 456 789"
  const phoneLink = phoneNumber.replace(/\s/g, "")

  return (
    <main className="min-h-screen bg-rich-black text-white pt-20">
      <Navbar />

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Mensaje enviado!"
        message="Tu formulario ha sido enviado con éxito. Te contactaremos pronto."
        redirectPath="/events"
        redirectDelay={2000} // 2 segundos
      />

      {/* Header */}
      <section className="relative py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl uppercase mb-6">Contacto</h1>
          <p className="text-xl text-gray-light max-w-3xl mx-auto font-cormorant">
            Estamos aquí para responder a tus preguntas y ayudarte a planificar tu participación.
          </p>
        </div>
      </section>

      {/* Contact Form and Info */}
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-dark-gray p-8">
              <h2 className="text-2xl font-bold mb-6">Envíanos un mensaje</h2>

              {submitError && (
                <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-6 flex items-start">
                  <AlertCircle className="h-5 w-5 text-burgundy mr-2 mt-0.5 flex-shrink-0" />
                  <p>{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-light mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-rich-black text-white border border-dark-gray focus:border-gold focus:outline-none"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-gray-light mb-2">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-rich-black text-white border border-dark-gray focus:border-gold focus:outline-none"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-gray-light mb-2">
                    Asunto
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-rich-black text-white border border-dark-gray focus:border-gold focus:outline-none"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label htmlFor="inquiryType" className="block text-gray-light mb-2">
                    Tipo de consulta
                  </label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-rich-black text-white border border-dark-gray focus:border-gold focus:outline-none"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="general">Información general</option>
                    <option value="events">Eventos</option>
                    <option value="speakers">Ponentes</option>
                    <option value="custom">Evento personalizado</option>
                    <option value="press">Prensa</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                {/* Campos adicionales para cargo y empresa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cargo" className="block text-gray-light mb-2">
                      Cargo (opcional)
                    </label>
                    <input
                      type="text"
                      id="cargo"
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-rich-black text-white border border-dark-gray focus:border-gold focus:outline-none"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="empresa" className="block text-gray-light mb-2">
                      Empresa (opcional)
                    </label>
                    <input
                      type="text"
                      id="empresa"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-rich-black text-white border border-dark-gray focus:border-gold focus:outline-none"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-light mb-2">
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-2 bg-rich-black text-white border border-dark-gray focus:border-gold focus:outline-none"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={privacyAccepted}
                    onChange={() => setPrivacyAccepted(!privacyAccepted)}
                    className="mt-1 mr-3"
                    required
                    disabled={isSubmitting}
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-light">
                    Acepto la política de privacidad y el tratamiento de mis datos personales para recibir respuesta a
                    mi consulta.
                  </label>
                </div>

                <button
                  type="submit"
                  className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-3 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Enviando...</span>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Enviar
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Información de contacto</h2>

              <div className="space-y-8 mb-12">
                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-gold mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold mb-1">Correo electrónico</h3>
                    <Link
                      href={`mailto:${settings.email || "info@meet-the-architect.com"}`}
                      className="text-gray-light hover:text-gold transition-colors"
                    >
                      {settings.email || "info@meet-the-architect.com"}
                    </Link>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-gold mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold mb-1">Teléfono</h3>
                    <Link href={`tel:${phoneLink}`} className="text-gray-light hover:text-gold transition-colors">
                      {phoneNumber}
                    </Link>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-gold mr-4 mt-1" />
                  <div>
                    <h3 className="font-bold mb-1">Dirección</h3>
                    <p className="text-gray-light">
                      {(settings.address || "Marx Halle Wien, Karl-Farkas-Gasse 19, 1030 Vienna, Austria")
                        .split(",")
                        .map((line, index) => (
                          <span key={index}>
                            {line.trim()}
                            {index < (settings.address || "").split(",").length - 1 && <br />}
                          </span>
                        ))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Maps iframe */}
              <div className="relative h-[300px] w-full bg-dark-gray">
                <iframe
                  src={generateGoogleMapsUrl(
                    settings.address || "Marx Halle Wien, Karl-Farkas-Gasse 19, 1030 Vienna, Austria",
                  )}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ubicación"
                ></iframe>
              </div>
              <div className="flex space-x-4 mt-4">
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
                            className="bg-burgundy hover:bg-burgundy/90 text-white p-2 rounded-full transition-colors"
                          >
                            <Facebook className="h-5 w-5" />
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
                            className="bg-burgundy hover:bg-burgundy/90 text-white p-2 rounded-full transition-colors"
                          >
                            <Twitter className="h-5 w-5" />
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
                            className="bg-burgundy hover:bg-burgundy/90 text-white p-2 rounded-full transition-colors"
                          >
                            <Instagram className="h-5 w-5" />
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
                            className="bg-burgundy hover:bg-burgundy/90 text-white p-2 rounded-full transition-colors"
                          >
                            <Linkedin className="h-5 w-5" />
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
                      className="bg-burgundy hover:bg-burgundy/90 text-white p-2 rounded-full transition-colors"
                    >
                      <Instagram className="h-5 w-5" />
                    </Link>
                    <Link
                      href="https://linkedin.com/company/meetthearchitect"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="bg-burgundy hover:bg-burgundy/90 text-white p-2 rounded-full transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organizers Section */}
      <section className="py-16 px-4 md:px-8 bg-rich-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Organizadores</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {settings.organizers && settings.organizers.length > 0 ? (
              // Mostrar organizadores desde la configuración
              settings.organizers.map((organizer, index) => (
                <div key={index} className="bg-dark-gray p-6">
                  <div className="flex items-center mb-4">
                    <div className="relative w-16 h-16 mr-4 overflow-hidden rounded-full">
                      {organizer.photo ? (
                        <img
                          src={organizer.photo || "/placeholder.svg"}
                          alt={organizer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="bg-rich-black flex items-center justify-center w-full h-full">
                          <div className="text-xs text-gray-light/50">org.{index + 1}</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{organizer.name}</h3>
                      <p className="text-gold">{organizer.position || "Organizador"}</p>
                    </div>
                  </div>
                  <p className="text-gray-light mb-4">
                    {organizer.bio || "Miembro del equipo organizador de Meet the Architect."}
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-light">
                      <Mail className="h-4 w-4 inline mr-2 text-gold" />
                      <Link href={`mailto:${organizer.email}`} className="hover:text-gold">
                        {organizer.email}
                      </Link>
                    </p>
                    {organizer.phone && (
                      <p className="text-gray-light">
                        <Phone className="h-4 w-4 inline mr-2 text-gold" />
                        <Link href={`tel:${organizer.phone.replace(/\s/g, "")}`} className="hover:text-gold">
                          {organizer.phone}
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              // Organizadores predeterminados si no hay ninguno configurado
              <>
                <div className="bg-dark-gray p-6">
                  <div className="flex items-center mb-4">
                    <div className="relative w-16 h-16 mr-4 bg-rich-black flex items-center justify-center rounded-full">
                      <div className="text-xs text-gray-light/50">org.1</div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">María García</h3>
                      <p className="text-gold">Directora de Eventos</p>
                    </div>
                  </div>
                  <p className="text-gray-light mb-4">
                    Especialista en organización de eventos arquitectónicos con más de 10 años de experiencia en el
                    sector.
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-light">
                      <Mail className="h-4 w-4 inline mr-2 text-gold" />
                      <Link href="mailto:maria@meet-the-architect.com" className="hover:text-gold">
                        maria@meet-the-architect.com
                      </Link>
                    </p>
                    <p className="text-gray-light">
                      <Phone className="h-4 w-4 inline mr-2 text-gold" />
                      <Link href="tel:+431234567891" className="hover:text-gold">
                        +43 123 456 7891
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="bg-dark-gray p-6">
                  <div className="flex items-center mb-4">
                    <div className="relative w-16 h-16 mr-4 bg-rich-black flex items-center justify-center rounded-full">
                      <div className="text-xs text-gray-light/50">org.2</div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Carlos Rodríguez</h3>
                      <p className="text-gold">Director de Contenido</p>
                    </div>
                  </div>
                  <p className="text-gray-light mb-4">
                    Arquitecto y profesor universitario encargado de la selección de ponentes y contenido para los
                    eventos.
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-light">
                      <Mail className="h-4 w-4 inline mr-2 text-gold" />
                      <Link href="mailto:carlos@meet-the-architect.com" className="hover:text-gold">
                        carlos@meet-the-architect.com
                      </Link>
                    </p>
                    <p className="text-gray-light">
                      <Phone className="h-4 w-4 inline mr-2 text-gold" />
                      <Link href="tel:+431234567892" className="hover:text-gold">
                        +43 123 456 7892
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="bg-dark-gray p-6">
                  <div className="flex items-center mb-4">
                    <div className="relative w-16 h-16 mr-4 bg-rich-black flex items-center justify-center rounded-full">
                      <div className="text-xs text-gray-light/50">org.3</div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Ana Müller</h3>
                      <p className="text-gold">Coordinadora de Patrocinios</p>
                    </div>
                  </div>
                  <p className="text-gray-light mb-4">
                    Responsable de las relaciones con patrocinadores y colaboradores para los eventos de Meet the
                    Architect.
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-light">
                      <Mail className="h-4 w-4 inline mr-2 text-gold" />
                      <Link href="mailto:ana@meet-the-architect.com" className="hover:text-gold">
                        ana@meet-the-architect.com
                      </Link>
                    </p>
                    <p className="text-gray-light">
                      <Phone className="h-4 w-4 inline mr-2 text-gold" />
                      <Link href="tel:+431234567893" className="hover:text-gold">
                        +43 123 456 7893
                      </Link>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Other Events Section */}
      <OtherEvents />

      {/* FAQ */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Preguntas frecuentes</h2>

          <div className="space-y-8">
            {settings.faqs && settings.faqs.length > 0 ? (
              // Mostrar FAQs desde la configuración
              settings.faqs.map((faq, index) => (
                <div key={index}>
                  <h3 className="text-xl font-bold mb-2">{faq.question}</h3>
                  <p className="text-gray-light">{faq.answer}</p>
                </div>
              ))
            ) : (
              // FAQs predeterminadas si no hay ninguna configurada
              <>
                <div>
                  <h3 className="text-xl font-bold mb-2">¿Cómo puedo comprar entradas para los eventos?</h3>
                  <p className="text-gray-light">
                    Puedes adquirir tus entradas directamente a través de nuestra página web en la sección de Tickets.
                    Ofrecemos diferentes tipos de entradas según tus necesidades y presupuesto.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">¿Puedo solicitar un reembolso si no puedo asistir?</h3>
                  <p className="text-gray-light">
                    Aceptamos cancelaciones con reembolso completo hasta 30 días antes del evento. Entre 30 y 15 días
                    antes, se reembolsará el 50% del importe. No se realizarán reembolsos para cancelaciones con menos
                    de 15 días de antelación.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">¿Ofrecen descuentos para estudiantes o grupos?</h3>
                  <p className="text-gray-light">
                    Sí, ofrecemos un 20% de descuento para estudiantes con identificación válida y descuentos especiales
                    para grupos de más de 5 personas. Contacta con nuestro equipo para más información.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">¿Cómo puedo participar como ponente en un evento?</h3>
                  <p className="text-gray-light">
                    Valoramos nuevas voces en el campo de la arquitectura. Envíanos tu propuesta con tu CV y portfolio a
                    speakers@meet-the-architect.com y nuestro comité evaluará tu candidatura.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
