"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { type Settings, type FAQ, type Organizer, useSettings } from "@/services/settings-service"
import { Mail, Phone, MapPin, Globe, Link2, HelpCircle, Users, Plus, X, Edit, Save, Trash2, Upload } from "lucide-react"

export default function SettingsTab() {
  const { settings: apiSettings, loading, error: apiError, fetchSettings, saveSettings } = useSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [settings, setSettings] = useState<Settings>({
    appName: "Meet the Architect",
    appDescription: "Plataforma para eventos de arquitectura",
    email: "info@meetthearchitect.com",
    phone: "+34 123 456 789",
    address: "Calle Principal 123, Madrid, España",
    socialLinks: [],
    adminEmail: "admin@meetthearchitect.com",
    faqs: [],
    organizers: [],
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [socialLinkInputs, setSocialLinkInputs] = useState<string[]>([])

  // State for managing FAQs
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null)
  const [newFaq, setNewFaq] = useState<FAQ>({ question: "", answer: "" })
  const [showAddFaq, setShowAddFaq] = useState(false)

  // State for managing Organizers
  const [editingOrganizerIndex, setEditingOrganizerIndex] = useState<number | null>(null)
  const [newOrganizer, setNewOrganizer] = useState<Organizer>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    country: "",
    position: "",
    photo: "",
  })
  const [showAddOrganizer, setShowAddOrganizer] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    fetchSettings()
  }, [])

  // Actualizar el estado local cuando se cargan las configuraciones de la API
  useEffect(() => {
    if (!loading && apiSettings) {
      setSettings({
        ...settings, // Keep existing defaults as fallback
        ...Object.fromEntries(Object.entries(apiSettings).filter(([_, value]) => value !== undefined)),
      })
      setSocialLinkInputs(apiSettings.socialLinks?.length ? [...apiSettings.socialLinks] : [])
    }
  }, [apiSettings, loading])

  // Manejar errores de la API
  useEffect(() => {
    if (apiError) {
      setError(apiError)
    }
  }, [apiError])

  // Actualizar la vista previa de la imagen cuando cambia la foto del organizador
  useEffect(() => {
    if (newOrganizer.photo) {
      setImagePreview(newOrganizer.photo)
    } else {
      setImagePreview(null)
    }
  }, [newOrganizer.photo])

  const handleSaveSettings = async () => {
    setError(null)
    try {
      // Asegurarse de que socialLinks esté actualizado con los valores actuales
      const updatedSettings = {
        ...settings,
        socialLinks: socialLinkInputs.filter((link) => link.trim() !== ""),
      }

      const success = await saveSettings(updatedSettings)
      if (success) {
        setSuccessMessage("Configuración guardada correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError("Error al guardar la configuración. Por favor, inténtalo de nuevo.")
      }
    } catch (err: any) {
      console.error("Error al guardar la configuración:", err)
      setError("Error al guardar la configuración: " + (err.message || "Error desconocido"))
    }
  }

  const restoreDefaultSettings = () => {
    setError(null)
    try {
      // Valores predeterminados
      const defaultSettings: Settings = {
        appName: "Meet the Architect",
        appDescription: "Plataforma para eventos de arquitectura",
        email: "info@meetthearchitect.com",
        phone: "+34 123 456 789",
        address: "Calle Principal 123, Madrid, España",
        socialLinks: [
          "https://facebook.com/meetthearchitect",
          "https://twitter.com/meetarchitect",
          "https://instagram.com/meetthearchitect",
          "https://linkedin.com/company/meetthearchitect",
        ],
        adminEmail: "admin@meetthearchitect.com",
        faqs: [
          {
            question: "¿Qué es Meet the Architect?",
            answer:
              "Meet the Architect es una plataforma para eventos de arquitectura que conecta a profesionales y entusiastas del sector.",
          },
          {
            question: "¿Cómo puedo registrarme para un evento?",
            answer:
              "Puedes registrarte para cualquier evento navegando a la página del evento y haciendo clic en el botón 'Registrarse'.",
          },
        ],
        organizers: [
          {
            name: "Ana García",
            email: "ana@meetthearchitect.com",
            phone: "+34 612 345 678",
            bio: "Arquitecta con más de 15 años de experiencia en proyectos sostenibles.",
            country: "España",
            position: "Directora de Eventos",
            photo: "/professional-headshot.png",
          },
        ],
      }

      setSettings(defaultSettings)
      setSocialLinkInputs(defaultSettings.socialLinks)
      setSuccessMessage("Valores predeterminados restaurados. Haz clic en Guardar para aplicar los cambios.")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error("Error al restaurar valores predeterminados:", err)
      setError("Error al restaurar los valores predeterminados: " + (err.message || "Error desconocido"))
    }
  }

  const addSocialLink = () => {
    setSocialLinkInputs([...socialLinkInputs, ""])
  }

  const removeSocialLink = (index: number) => {
    const newLinks = [...socialLinkInputs]
    newLinks.splice(index, 1)
    setSocialLinkInputs(newLinks)
  }

  const updateSocialLink = (index: number, value: string) => {
    const newLinks = [...socialLinkInputs]
    newLinks[index] = value || "" // Ensure we never set undefined
    setSocialLinkInputs(newLinks)
  }

  // FAQ Management Functions
  const handleAddFaq = () => {
    if (newFaq.question.trim() === "" || newFaq.answer.trim() === "") {
      setError("La pregunta y la respuesta son obligatorias")
      return
    }

    setSettings({
      ...settings,
      faqs: [...(settings.faqs || []), { ...newFaq }],
    })

    setNewFaq({ question: "", answer: "" })
    setShowAddFaq(false)
    setSuccessMessage("FAQ añadida correctamente")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleUpdateFaq = (index: number) => {
    if (!settings.faqs) return

    const updatedFaqs = [...settings.faqs]
    updatedFaqs[index] = { ...newFaq }

    setSettings({
      ...settings,
      faqs: updatedFaqs,
    })

    setNewFaq({ question: "", answer: "" })
    setEditingFaqIndex(null)
    setSuccessMessage("FAQ actualizada correctamente")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleEditFaq = (index: number) => {
    if (!settings.faqs) return
    setNewFaq({ ...settings.faqs[index] })
    setEditingFaqIndex(index)
  }

  const handleDeleteFaq = (index: number) => {
    if (!settings.faqs) return

    const updatedFaqs = [...settings.faqs]
    updatedFaqs.splice(index, 1)

    setSettings({
      ...settings,
      faqs: updatedFaqs,
    })

    setSuccessMessage("FAQ eliminada correctamente")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const cancelFaqEdit = () => {
    setNewFaq({ question: "", answer: "" })
    setEditingFaqIndex(null)
    setShowAddFaq(false)
  }

  // Organizer Management Functions
  const handleAddOrganizer = () => {
    if (newOrganizer.name.trim() === "" || newOrganizer.email.trim() === "") {
      setError("El nombre y el email del organizador son obligatorios")
      return
    }

    setSettings({
      ...settings,
      organizers: [...(settings.organizers || []), { ...newOrganizer }],
    })

    setNewOrganizer({
      name: "",
      email: "",
      phone: "",
      bio: "",
      country: "",
      position: "",
      photo: "",
    })
    setImagePreview(null)
    setShowAddOrganizer(false)
    setSuccessMessage("Organizador añadido correctamente")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleUpdateOrganizer = (index: number) => {
    if (!settings.organizers) return

    const updatedOrganizers = [...settings.organizers]
    updatedOrganizers[index] = { ...newOrganizer }

    setSettings({
      ...settings,
      organizers: updatedOrganizers,
    })

    setNewOrganizer({
      name: "",
      email: "",
      phone: "",
      bio: "",
      country: "",
      position: "",
      photo: "",
    })
    setImagePreview(null)
    setEditingOrganizerIndex(null)
    setSuccessMessage("Organizador actualizado correctamente")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleEditOrganizer = (index: number) => {
    if (!settings.organizers) return
    setNewOrganizer({ ...settings.organizers[index] })
    setImagePreview(settings.organizers[index].photo || null)
    setEditingOrganizerIndex(index)
  }

  const handleDeleteOrganizer = (index: number) => {
    if (!settings.organizers) return

    const updatedOrganizers = [...settings.organizers]
    updatedOrganizers.splice(index, 1)

    setSettings({
      ...settings,
      organizers: updatedOrganizers,
    })

    setSuccessMessage("Organizador eliminado correctamente")
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const cancelOrganizerEdit = () => {
    setNewOrganizer({
      name: "",
      email: "",
      phone: "",
      bio: "",
      country: "",
      position: "",
      photo: "",
    })
    setImagePreview(null)
    setEditingOrganizerIndex(null)
    setShowAddOrganizer(false)
  }

  // Función para manejar la carga de imágenes
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      setUploadingImage(true)
      setError(null)
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        setNewOrganizer({
          ...newOrganizer,
          photo: data.imageUrl,
        })
        setImagePreview(data.imageUrl)
        setSuccessMessage("Imagen subida correctamente")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setError(data.message || "Error al subir la imagen")
      }
    } catch (err: any) {
      console.error("Error uploading image:", err)
      setError(err.message || "Error al subir la imagen")
    } finally {
      setUploadingImage(false)
    }
  }

  // Función para abrir el selector de archivos
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Función para eliminar la imagen
  const removeImage = () => {
    setNewOrganizer({
      ...newOrganizer,
      photo: "",
    })
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
        <p className="mt-4 text-gray-light">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Configuración del Sitio</h2>

      {error && (
        <div className="bg-burgundy/20 border border-burgundy p-4 rounded-md mb-4">
          <p className="text-white">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-900/20 border border-green-500 p-4 rounded-md mb-4">
          <p className="text-white">{successMessage}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Información básica del sitio */}
        <div className="bg-rich-black p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-burgundy" />
            Información General
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="appName">
                Nombre del sitio
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-dark-gray leading-tight focus:outline-none focus:shadow-outline"
                id="appName"
                type="text"
                placeholder="Nombre del sitio"
                value={settings.appName}
                onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="appDescription">
                Descripción del sitio
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-dark-gray leading-tight focus:outline-none focus:shadow-outline"
                id="appDescription"
                placeholder="Descripción del sitio"
                value={settings.appDescription}
                onChange={(e) => setSettings({ ...settings, appDescription: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="bg-rich-black p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-burgundy" />
            Información de Contacto
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="email">
                Email de contacto
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-dark-gray leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="Email de contacto"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="adminEmail">
                Email del administrador
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-dark-gray leading-tight focus:outline-none focus:shadow-outline"
                id="adminEmail"
                type="email"
                placeholder="Email del administrador"
                value={settings.adminEmail}
                onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="phone">
                Número de teléfono
              </label>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-light mr-2" />
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-dark-gray leading-tight focus:outline-none focus:shadow-outline"
                  id="phone"
                  type="tel"
                  placeholder="Número de teléfono"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-light text-sm font-bold mb-2" htmlFor="address">
                Dirección
              </label>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-gray-light mr-2" />
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-dark-gray leading-tight focus:outline-none focus:shadow-outline"
                  id="address"
                  type="text"
                  placeholder="Dirección"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="bg-rich-black p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-burgundy" />
            Redes Sociales
          </h3>
          <div className="space-y-4">
            {socialLinkInputs.map((link, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-dark-gray leading-tight focus:outline-none focus:shadow-outline"
                  type="url"
                  placeholder="URL de red social"
                  value={link || ""}
                  onChange={(e) => updateSocialLink(index, e.target.value)}
                />
                <button
                  onClick={() => removeSocialLink(index)}
                  className="bg-red-500 hover:bg-red-700 text-white px-3 py-2 rounded-md transition-colors"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button
              onClick={addSocialLink}
              className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors"
            >
              Añadir Red Social
            </button>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-rich-black p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-burgundy" />
            Preguntas Frecuentes (FAQs)
          </h3>

          <div className="space-y-4">
            {/* Lista de FAQs existentes */}
            {settings.faqs && settings.faqs.length > 0 ? (
              <div className="space-y-4">
                {settings.faqs.map((faq, index) => (
                  <div key={index} className="bg-dark-gray p-4 rounded-md">
                    {editingFaqIndex === index ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-gray-light text-sm font-bold mb-2">Pregunta</label>
                          <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                            type="text"
                            value={newFaq.question}
                            onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-light text-sm font-bold mb-2">Respuesta</label>
                          <textarea
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                            rows={3}
                            value={newFaq.answer}
                            onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={cancelFaqEdit}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <X className="h-4 w-4" /> Cancelar
                          </button>
                          <button
                            onClick={() => handleUpdateFaq(index)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Save className="h-4 w-4" /> Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gold">{faq.question}</h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditFaq(index)}
                              className="text-gray-light hover:text-white transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFaq(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-gray-light">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-light italic">No hay preguntas frecuentes configuradas.</p>
            )}

            {/* Formulario para añadir nueva FAQ */}
            {showAddFaq ? (
              <div className="bg-dark-gray p-4 rounded-md mt-4">
                <h4 className="font-bold mb-3">Añadir nueva pregunta frecuente</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-light text-sm font-bold mb-2">Pregunta</label>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                      type="text"
                      placeholder="Escribe la pregunta"
                      value={newFaq.question}
                      onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-light text-sm font-bold mb-2">Respuesta</label>
                    <textarea
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Escribe la respuesta"
                      rows={3}
                      value={newFaq.answer}
                      onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={cancelFaqEdit}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                    >
                      <X className="h-4 w-4" /> Cancelar
                    </button>
                    <button
                      onClick={handleAddFaq}
                      className="bg-burgundy hover:bg-burgundy/90 text-white px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Añadir
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddFaq(true)}
                className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" /> Añadir Pregunta Frecuente
              </button>
            )}
          </div>
        </div>

        {/* Organizadores */}
        <div className="bg-rich-black p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-burgundy" />
            Organizadores
          </h3>

          <div className="space-y-4">
            {/* Lista de organizadores existentes */}
            {settings.organizers && settings.organizers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.organizers.map((organizer, index) => (
                  <div key={index} className="bg-dark-gray p-4 rounded-md">
                    {editingOrganizerIndex === index ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-gray-light text-sm font-bold mb-2">Nombre</label>
                            <input
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                              type="text"
                              value={newOrganizer.name}
                              onChange={(e) => setNewOrganizer({ ...newOrganizer, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-light text-sm font-bold mb-2">Email</label>
                            <input
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                              type="email"
                              value={newOrganizer.email}
                              onChange={(e) => setNewOrganizer({ ...newOrganizer, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-light text-sm font-bold mb-2">Teléfono</label>
                            <input
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                              type="tel"
                              value={newOrganizer.phone || ""}
                              onChange={(e) => setNewOrganizer({ ...newOrganizer, phone: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-light text-sm font-bold mb-2">Cargo</label>
                            <input
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                              type="text"
                              placeholder="Cargo o posición"
                              value={newOrganizer.position || ""}
                              onChange={(e) => setNewOrganizer({ ...newOrganizer, position: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-light text-sm font-bold mb-2">País</label>
                            <input
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                              type="text"
                              placeholder="País"
                              value={newOrganizer.country || ""}
                              onChange={(e) => setNewOrganizer({ ...newOrganizer, country: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-light text-sm font-bold mb-2">Foto</label>
                            <div className="space-y-2">
                              {imagePreview && (
                                <div className="relative w-24 h-24 mb-2">
                                  <img
                                    src={imagePreview || "/placeholder.svg"}
                                    alt="Vista previa"
                                    className="w-24 h-24 object-cover rounded-md"
                                  />
                                  <button
                                    onClick={removeImage}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-700 text-white rounded-full p-1"
                                    title="Eliminar imagen"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                              <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                              <button
                                type="button"
                                onClick={triggerFileInput}
                                disabled={uploadingImage}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md transition-colors flex items-center gap-1"
                              >
                                {uploadingImage ? (
                                  <>
                                    <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-1"></div>
                                    Subiendo...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4" /> Seleccionar imagen
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-gray-light text-sm font-bold mb-2">Biografía</label>
                          <textarea
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                            rows={3}
                            value={newOrganizer.bio || ""}
                            onChange={(e) => setNewOrganizer({ ...newOrganizer, bio: e.target.value })}
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={cancelOrganizerEdit}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <X className="h-4 w-4" /> Cancelar
                          </button>
                          <button
                            onClick={() => handleUpdateOrganizer(index)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Save className="h-4 w-4" /> Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-4">
                        {organizer.photo && (
                          <div className="flex-shrink-0">
                            <img
                              src={organizer.photo || "/placeholder.svg"}
                              alt={organizer.name}
                              className="w-24 h-24 object-cover rounded-full"
                            />
                          </div>
                        )}
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gold">{organizer.name}</h4>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditOrganizer(index)}
                                className="text-gray-light hover:text-white transition-colors"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrganizer(index)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          {organizer.position && <p className="text-gold text-sm">{organizer.position}</p>}
                          <p className="text-gray-light text-sm mt-1">
                            <Mail className="h-3 w-3 inline mr-1" /> {organizer.email}
                          </p>
                          {organizer.phone && (
                            <p className="text-gray-light text-sm">
                              <Phone className="h-3 w-3 inline mr-1" /> {organizer.phone}
                            </p>
                          )}
                          {organizer.country && (
                            <p className="text-gray-light text-sm">
                              <MapPin className="h-3 w-3 inline mr-1" /> {organizer.country}
                            </p>
                          )}
                          {organizer.bio && (
                            <p className="mt-2 text-sm text-gray-light line-clamp-2">{organizer.bio}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-light italic">No hay organizadores configurados.</p>
            )}

            {/* Formulario para añadir nuevo organizador */}
            {showAddOrganizer ? (
              <div className="bg-dark-gray p-4 rounded-md mt-4">
                <h4 className="font-bold mb-3">Añadir nuevo organizador</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-light text-sm font-bold mb-2">Nombre</label>
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        placeholder="Nombre completo"
                        value={newOrganizer.name}
                        onChange={(e) => setNewOrganizer({ ...newOrganizer, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-light text-sm font-bold mb-2">Email</label>
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                        type="email"
                        placeholder="Email de contacto"
                        value={newOrganizer.email}
                        onChange={(e) => setNewOrganizer({ ...newOrganizer, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-light text-sm font-bold mb-2">Teléfono</label>
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                        type="tel"
                        placeholder="Número de teléfono"
                        value={newOrganizer.phone || ""}
                        onChange={(e) => setNewOrganizer({ ...newOrganizer, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-light text-sm font-bold mb-2">Cargo</label>
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        placeholder="Cargo o posición"
                        value={newOrganizer.position || ""}
                        onChange={(e) => setNewOrganizer({ ...newOrganizer, position: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-light text-sm font-bold mb-2">País</label>
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        placeholder="País"
                        value={newOrganizer.country || ""}
                        onChange={(e) => setNewOrganizer({ ...newOrganizer, country: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-light text-sm font-bold mb-2">Foto</label>
                      <div className="space-y-2">
                        {imagePreview && (
                          <div className="relative w-24 h-24 mb-2">
                            <img
                              src={imagePreview || "/placeholder.svg"}
                              alt="Vista previa"
                              className="w-24 h-24 object-cover rounded-md"
                            />
                            <button
                              onClick={removeImage}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-700 text-white rounded-full p-1"
                              title="Eliminar imagen"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          disabled={uploadingImage}
                          className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md transition-colors flex items-center gap-1"
                        >
                          {uploadingImage ? (
                            <>
                              <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-1"></div>
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" /> Seleccionar imagen
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-light text-sm font-bold mb-2">Biografía</label>
                    <textarea
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-white bg-rich-black leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Breve biografía profesional"
                      rows={3}
                      value={newOrganizer.bio || ""}
                      onChange={(e) => setNewOrganizer({ ...newOrganizer, bio: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={cancelOrganizerEdit}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                    >
                      <X className="h-4 w-4" /> Cancelar
                    </button>
                    <button
                      onClick={handleAddOrganizer}
                      className="bg-burgundy hover:bg-burgundy/90 text-white px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Añadir
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddOrganizer(true)}
                className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" /> Añadir Organizador
              </button>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-4 justify-end mt-8">
          <button
            onClick={restoreDefaultSettings}
            className="px-4 py-2 rounded-md border border-gray-600 hover:bg-gray-700 transition-colors"
          >
            Restaurar Valores Predeterminados
          </button>
          <button
            onClick={handleSaveSettings}
            className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  )
}
