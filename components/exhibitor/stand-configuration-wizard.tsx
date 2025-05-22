"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Check,
  X,
  AlertCircle,
  Info,
  ShoppingCart,
  CreditCard,
  ListChecks,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { PaymentStatusModal } from "@/components/payment/payment-status-modal"

// Define types for the wizard
interface StandOptionItem {
  _id?: string
  label: string
  imageUrl?: string
  price: number
  description?: string
}

interface StandItem {
  _id?: string
  label: string
  type: "text" | "image" | "select" | "upload"
  required: boolean
  maxSelections?: number
  inputPlaceholder?: string
  showImage?: boolean
  options?: StandOptionItem[]
  description?: string
}

interface StandOption {
  _id: string
  title: string
  description?: string
  items: StandItem[]
  event: string
}

interface StandConfigurationWizardProps {
  standOptions: StandOption[]
  initialConfigs?: { [standOptionId: string]: any }
  onComplete: (configs: { [standOptionId: string]: any }) => Promise<{ [standOptionId: string]: any }>
  onCancel?: () => void
  eventTitle?: string
}

export default function StandConfigurationWizard({
  standOptions,
  initialConfigs = {},
  onComplete,
  onCancel,
  eventTitle = "Meet the Architect",
}: StandConfigurationWizardProps) {
  const router = useRouter()
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [configurations, setConfigurations] = useState<{ [standOptionId: string]: any }>(initialConfigs)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [subtotals, setSubtotals] = useState<{ [standOptionId: string]: number }>({})
  const [priceBreakdowns, setPriceBreakdowns] = useState<{ [standOptionId: string]: Record<string, number> }>({})
  const [selectedItems, setSelectedItems] = useState<{
    [standOptionId: string]: {
      [itemId: string]: { label: string; option?: string; price: number; optionLabel?: string }
    }
  }>({})
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showingSummary, setShowingSummary] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [configId, setConfigId] = useState<string | null>(null)

  // Get current stand option
  const currentOption = standOptions[currentOptionIndex]

  // Calculate total number of steps across all options
  const totalSteps = standOptions.reduce((total, option) => total + option.items.length, 0)

  // Calculate the absolute step number (across all options)
  const calculateAbsoluteStep = () => {
    let step = 0
    for (let i = 0; i < currentOptionIndex; i++) {
      step += standOptions[i].items.length
    }
    return step + currentStepIndex
  }

  const absoluteStep = calculateAbsoluteStep()
  const progressPercentage = showingSummary ? 100 : ((absoluteStep + 1) / (totalSteps + 1)) * 100

  // Calculate subtotals whenever configurations change
  useEffect(() => {
    const newSubtotals: { [standOptionId: string]: number } = {}
    const newPriceBreakdowns: { [standOptionId: string]: Record<string, number> } = {}
    const newSelectedItems: {
      [standOptionId: string]: {
        [itemId: string]: { label: string; option?: string; price: number; optionLabel?: string }
      }
    } = {}

    // Process each stand option
    standOptions.forEach((option) => {
      let total = 0
      const optionSelectedItems: {
        [itemId: string]: { label: string; option?: string; price: number; optionLabel?: string }
      } = {}

      // Initialize price breakdown for this option
      const priceBreakdown: Record<string, number> = {}

      // Get configuration for this option
      const config = configurations[option._id] || {}

      // Loop through all configuration items for this option
      Object.entries(config).forEach(([itemId, value]: [string, any]) => {
        // Find the corresponding item in the stand option
        const item = option.items.find((i) => i._id === itemId)

        if (item && (item.type === "select" || item.type === "image") && item.options) {
          // For select/image types, check which options are selected
          if (Array.isArray(value)) {
            // Multiple selections
            value.forEach((selectedOptionId: string) => {
              const optionItem = item.options?.find((o) => o._id === selectedOptionId)
              if (optionItem) {
                const price = optionItem.price || 0
                total += price

                // Add to price breakdown
                const category = item.label
                priceBreakdown[category] = (priceBreakdown[category] || 0) + price

                optionSelectedItems[`${itemId}-${selectedOptionId}`] = {
                  label: item.label,
                  option: selectedOptionId,
                  price: price,
                  optionLabel: optionItem.label,
                }
              }
            })
          } else if (typeof value === "string") {
            // Single selection
            const optionItem = item.options?.find((o) => o._id === value)
            if (optionItem) {
              const price = optionItem.price || 0
              total += price

              // Add to price breakdown
              const category = item.label
              priceBreakdown[category] = (priceBreakdown[category] || 0) + price

              optionSelectedItems[itemId] = {
                label: item.label,
                option: value,
                price: price,
                optionLabel: optionItem.label,
              }
            }
          }
        } else if (item && item.type === "text" && value) {
          // For text inputs, just record that something was entered
          optionSelectedItems[itemId] = {
            label: item.label,
            price: 0,
            optionLabel: value.substring(0, 30) + (value.length > 30 ? "..." : ""),
          }
        } else if (item && item.type === "upload" && value) {
          // For uploads, record that a file was uploaded
          optionSelectedItems[itemId] = {
            label: item.label,
            price: 0,
            optionLabel: "File uploaded",
          }
        }
      })

      newSubtotals[option._id] = total
      newPriceBreakdowns[option._id] = priceBreakdown
      newSelectedItems[option._id] = optionSelectedItems
    })

    setSubtotals(newSubtotals)
    setPriceBreakdowns(newPriceBreakdowns)
    setSelectedItems(newSelectedItems)
  }, [configurations, standOptions])

  // Scroll to top when changing steps
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentOptionIndex, currentStepIndex, showingSummary])

  // Handle next step
  const handleNext = () => {
    // If showing summary, handle completion
    if (showingSummary) {
      handleComplete()
      return
    }

    // Get current item
    const currentItem = currentOption.items[currentStepIndex]

    // Get configuration for current option
    const currentConfig = configurations[currentOption._id] || {}

    // Get value for current item
    const currentValue = currentConfig[currentItem._id || `item-${currentStepIndex}`]

    // Validate current step
    if (currentItem.required && (currentValue === undefined || currentValue === "" || currentValue === null)) {
      setError(`This field is required`)
      return
    }

    // Clear any errors
    setError(null)

    // Check if we're at the last step of the current option
    if (currentStepIndex < currentOption.items.length - 1) {
      // Move to next step within current option
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      // Check if we're at the last option
      if (currentOptionIndex < standOptions.length - 1) {
        // Move to first step of next option
        setCurrentOptionIndex(currentOptionIndex + 1)
        setCurrentStepIndex(0)
      } else {
        // We've completed all options, show summary
        setShowingSummary(true)
      }
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    // If showing summary, go back to last step of last option
    if (showingSummary) {
      setShowingSummary(false)
      return
    }

    // Clear any errors
    setError(null)

    // Check if we're at the first step of the current option
    if (currentStepIndex > 0) {
      // Move to previous step within current option
      setCurrentStepIndex(currentStepIndex - 1)
    } else {
      // Check if we're at the first option
      if (currentOptionIndex > 0) {
        // Move to last step of previous option
        setCurrentOptionIndex(currentOptionIndex - 1)
        setCurrentStepIndex(standOptions[currentOptionIndex - 1].items.length - 1)
      } else {
        // We're at the very first step, cancel if possible
        if (onCancel) {
          onCancel()
        }
      }
    }
  }

  // Create item metadata for the configuration
  const createItemMetadata = (item: StandItem, value: any, config: any) => {
    // Create item metadata
    const itemMetadata: any = {
      id: item._id,
      label: item.label,
      type: item.type,
      description: item.description,
      value: value,
    }

    // For select/image types, add selected option details
    if ((item.type === "select" || item.type === "image") && item.options) {
      if (Array.isArray(value)) {
        // Multiple selections
        itemMetadata.selectedOptions = value
          .map((optionId) => {
            const selectedOption = item.options?.find((o) => o._id === optionId)
            return selectedOption
              ? {
                  id: selectedOption._id,
                  label: selectedOption.label,
                  price: selectedOption.price,
                  description: selectedOption.description,
                }
              : null
          })
          .filter(Boolean)
      } else if (value) {
        // Single selection
        const selectedOption = item.options.find((o) => o._id === value)
        if (selectedOption) {
          itemMetadata.selectedOption = {
            id: selectedOption._id,
            label: selectedOption.label,
            price: selectedOption.price,
            description: selectedOption.description,
          }
        }
      }
    }

    return itemMetadata
  }

  // Handle completion of the wizard
  const handleComplete = async () => {
    if (!termsAccepted) {
      setError("You must accept the Terms and Conditions to proceed")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Prepare the enhanced configurations with metadata
      const enhancedConfigs: { [standOptionId: string]: any } = {}

      // For each stand option
      standOptions.forEach((option) => {
        // Get the current configuration for this option
        const currentConfig = configurations[option._id] || {}
        const totalPrice = subtotals[option._id] || 0
        const priceBreakdown = priceBreakdowns[option._id] || {}

        // Create an enhanced configuration with metadata
        const enhancedConfig: any = {
          // Include the original configuration values
          ...currentConfig,
          // Add metadata
          _metadata: {
            optionTitle: option.title,
            optionDescription: option.description,
            items: option.items.map((item) => {
              // Get the value for this item
              const value = currentConfig[item._id || `item-${option.items.indexOf(item)}`]
              return createItemMetadata(item, value, currentConfig)
            }),
            totalPrice: totalPrice,
            priceBreakdown: priceBreakdown,
          },
        }

        // Add to the enhanced configurations
        enhancedConfigs[option._id] = {
          configData: enhancedConfig,
          totalPrice: totalPrice,
          priceBreakdown: priceBreakdown,
          isSubmitted: true,
          paymentStatus: "pending", // Default payment status
        }
      })

      // Pass the enhanced configurations to the parent component
      console.log("Enhanced configs being sent:", enhancedConfigs)
      
      const savedConfigs = await onComplete(enhancedConfigs)
      const configsToUse = savedConfigs || enhancedConfigs

      // Get the configuration ID
      let newConfigId = null
      let newTicketId = null
      if (configsToUse && typeof configsToUse === 'object' && Object.keys(configsToUse).length > 0) {
        const firstKey = Object.keys(configsToUse)[0]
        const firstConfig = configsToUse[firstKey]
        
        // Primero intentamos obtener el ticketId
        if (firstConfig && firstConfig.ticketId) {
          newTicketId = firstConfig.ticketId
        } else if (firstConfig && firstConfig.configData && firstConfig.configData.ticketId) {
          newTicketId = firstConfig.configData.ticketId
        }

        // Si no hay ticketId, usamos el _id como fallback
        if (!newTicketId) {
          if (firstConfig && firstConfig._id) {
            newConfigId = firstConfig._id
          } else if (firstConfig && firstConfig.configData && firstConfig.configData._id) {
            newConfigId = firstConfig.configData._id
          } else if (firstConfig && firstConfig.id) {
            newConfigId = firstConfig.id
          } else if (typeof firstKey === 'string' && firstKey.length > 0) {
            newConfigId = firstKey
          }
        }
      }

      const idToUse = newTicketId || newConfigId

      if (!idToUse) {
        throw new Error("No se pudo obtener el ID de la configuración después de guardar")
      }

      setConfigId(idToUse)

      // Calculate total amount
      const totalAmount = calculateTotal().toFixed(2)

      if (Number.parseFloat(totalAmount) > 0) {
        const eventName = eventTitle || "Meet the Architect"
        const description = `Stand configuration for ${eventName}`
        const redirectUrl = `${window.location.origin}/payment/success?source=stand-config&ticketId=${idToUse}`

        try {
          const { PaymentService } = await import("@/services/payment-service")
          const paymentResponse = await PaymentService.createPayment({
            amount: totalAmount,
            description,
            redirectUrl,
            ticketId: idToUse,
          })

          // Agregar logs para depuración
          console.log("🔍 Configuración guardada:", configsToUse)
          console.log("📝 ID a usar para el pago:", idToUse)
          console.log("🔗 URL de redirección:", redirectUrl)

          if (paymentResponse.error) {
            throw new Error(paymentResponse.error)
          }

          if (paymentResponse.paymentUrl && paymentResponse.paymentId) {
            setPaymentId(paymentResponse.paymentId)
            window.open(paymentResponse.paymentUrl, '_blank')
            setPaymentModalOpen(true)
          } else {
            throw new Error("No payment URL or ID returned")
          }
        } catch (paymentError: any) {
          setError(`Error al procesar el pago: ${paymentError.message}`)
          setIsSubmitting(false)
        }
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.refresh()
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || "Error al guardar la configuración")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle change in configuration
  const handleConfigChange = (itemId: string, value: any) => {
    setConfigurations((prev) => {
      // Get current option configuration or initialize empty object
      const currentConfig = prev[currentOption._id] || {}

      // Update the configuration for this option
      const updatedConfig = {
        ...currentConfig,
        [itemId]: value,
      }

      // Return updated configurations
      return {
        ...prev,
        [currentOption._id]: updatedConfig,
      }
    })

    setError(null)
  }

  // Handle file upload
  const handleFileUpload = async (itemId: string, file: File) => {
    try {
      // Create a FormData object
      const formData = new FormData()
      formData.append("file", file)

      // Upload the file
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload file")
      }

      const data = await response.json()
      const fileUrl = data.imageUrl || data.fileUrl

      // Update configuration with the file URL
      handleConfigChange(itemId, fileUrl)
    } catch (err: any) {
      console.error("Error uploading file:", err)
      setError(err.message || "Failed to upload file")
    }
  }

  // Calculate total across all options
  const calculateTotal = () => {
    return Object.values(subtotals).reduce((total, subtotal) => total + subtotal, 0)
  }

  // If the wizard is completed successfully
  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Configuration Complete!</h2>
          <p className="text-gray-600 mb-6">Your booth configuration has been successfully saved.</p>
          <button
            onClick={() => router.refresh()}
            className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto" ref={topRef}>
      {/* Header with event title */}
      <div className="bg-gray-100 p-4 border-b border-gray-200 text-center">
        <h1 className="text-xl font-medium text-gray-700">{eventTitle}</h1>
      </div>

      {/* Progress indicator */}
      <div className="relative px-8 pt-8">
        <div className="flex items-center justify-between">
          {/* User icon at start */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${currentOptionIndex === 0 && currentStepIndex === 0 ? "bg-burgundy text-white" : "bg-gray-300 text-gray-600"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          {/* Progress line */}
          <div className="absolute left-0 right-0 top-[3.25rem] h-1 bg-gray-200">
            <div
              className="h-1 bg-burgundy transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          {/* Step indicators - we'll show a subset of steps to avoid overcrowding */}
          {Array.from({ length: Math.min(7, totalSteps) }).map((_, index) => {
            // Calculate the step number to display
            const stepNumber = Math.ceil((index + 1) * (totalSteps / Math.min(7, totalSteps)))

            return (
              <div
                key={index}
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                  absoluteStep >= stepNumber
                    ? "bg-burgundy text-white"
                    : absoluteStep === stepNumber - 1
                      ? "bg-burgundy text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                <span>{index + 1}</span>
              </div>
            )
          })}

          {/* Summary icon at end */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
              showingSummary ? "bg-burgundy text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Option title */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-500">
              {showingSummary ? "Order Summary" : `Option ${currentOptionIndex + 1} of ${standOptions.length}`}
            </h2>
            {!showingSummary && (
              <span className="text-sm text-burgundy font-medium">
                Step {currentStepIndex + 1} of {currentOption.items.length}
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">
            {showingSummary ? "Review Your Configuration" : currentOption.title}
          </h3>
          {!showingSummary && currentOption.description && (
            <p className="text-gray-600 mt-2">{currentOption.description}</p>
          )}
        </div>

        {showingSummary ? (
          /* Order Summary */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <p className="text-gray-600">
                Thank you for your selection! We have summarized your order below. To finalize your order, please review
                and confirm.
              </p>
            </div>

            {/* Summary for each option */}
            {standOptions.map((option, optionIndex) => (
              <div key={option._id} className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-burgundy text-white text-xs flex items-center justify-center mr-2">
                      {optionIndex + 1}
                    </span>
                    {option.title}
                  </h4>
                  <span className="text-burgundy font-medium">€{subtotals[option._id]?.toFixed(2) || "0.00"}</span>
                </div>

                {/* Selected items for this option */}
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Item
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Selection
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.values(selectedItems[option._id] || {}).map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.label}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.optionLabel || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                            € {item.price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {Object.keys(selectedItems[option._id] || {}).length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                            No items configured for this option
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center text-lg font-bold">
                <span className="text-gray-800">Total amount of your order</span>
                <span className="text-burgundy">€ {calculateTotal().toFixed(2)} Euros</span>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start mt-6">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-5 w-5 text-burgundy focus:ring-burgundy rounded mt-1"
              />
              <label htmlFor="terms" className="ml-3 text-gray-700">
                I have read the{" "}
                <a href="#" className="text-burgundy hover:underline">
                  General Terms and Conditions
                </a>{" "}
                and accept them.
              </label>
            </div>
          </div>
        ) : (
          /* Configuration steps */
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-800">{currentOption.items[currentStepIndex]?.label}</h2>

            {currentOption.items[currentStepIndex]?.description && (
              <p className="text-gray-600 mb-6">{currentOption.items[currentStepIndex].description}</p>
            )}

            <div className="mb-8">
              {/* Text input */}
              {currentOption.items[currentStepIndex]?.type === "text" && (
                <div>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy text-gray-800 bg-white"
                    placeholder={currentOption.items[currentStepIndex].inputPlaceholder || ""}
                    value={
                      (configurations[currentOption._id] || {})[
                        currentOption.items[currentStepIndex]._id || `item-${currentStepIndex}`
                      ] || ""
                    }
                    onChange={(e) =>
                      handleConfigChange(
                        currentOption.items[currentStepIndex]._id || `item-${currentStepIndex}`,
                        e.target.value,
                      )
                    }
                    required={currentOption.items[currentStepIndex].required}
                  />
                </div>
              )}

              {/* File upload */}
              {currentOption.items[currentStepIndex]?.type === "upload" && (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
                  <div className="text-center">
                    {(configurations[currentOption._id] || {})[
                      currentOption.items[currentStepIndex]._id || `item-${currentStepIndex}`
                    ] ? (
                      <div className="mb-4">
                        <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                          {(configurations[currentOption._id] || {})[
                            currentOption.items[currentStepIndex]._id || `item-${currentStepIndex}`
                          ].match(/\.(jpeg|jpg|gif|png)$/i) ? (
                            <Image
                              src={
                                (configurations[currentOption._id] || {})[
                                  currentOption.items[currentStepIndex]._id || `item-${currentStepIndex}`
                                ] || "/placeholder.svg"
                              }
                              alt="Uploaded file"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <Check className="h-12 w-12 text-green-500 mx-auto mb-2" />
                                <p className="text-gray-600">File uploaded successfully</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            handleConfigChange(
                              currentOption.items[currentStepIndex]._id || `item-${currentStepIndex}`,
                              null,
                            )
                          }
                          className="mt-2 text-burgundy hover:text-burgundy/80 flex items-center gap-1 mx-auto"
                        >
                          <X className="h-4 w-4" />
                          <span>Remove file</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">
                          {currentOption.items[currentStepIndex].inputPlaceholder || "Upload a file"}
                        </p>
                        <p className="text-gray-400 text-sm mb-4">Click or drag and drop</p>
                        <input
                          type="file"
                          className="hidden"
                          id="file-upload"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(
                                currentOption.items[currentStepIndex]._id || `item-${currentStepIndex}`,
                                e.target.files[0],
                              )
                            }
                          }}
                          accept="image/*"
                        />
                        <label
                          htmlFor="file-upload"
                          className="bg-burgundy hover:bg-burgundy/90 text-white px-4 py-2 rounded-md transition-colors cursor-pointer"
                        >
                          Select File
                        </label>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Select options */}
              {currentOption.items[currentStepIndex]?.type === "select" &&
                currentOption.items[currentStepIndex].options &&
                currentOption.items[currentStepIndex].options.length > 0 && (
                  <div className="space-y-4">
                    {currentOption.items[currentStepIndex].options.map((option, index) => {
                      const itemId = currentOption.items[currentStepIndex]._id || `item-${currentStepIndex}`
                      const currentValue = (configurations[currentOption._id] || {})[itemId]
                      const isSelected = Array.isArray(currentValue)
                        ? currentValue.includes(option._id)
                        : currentValue === option._id

                      return (
                        <div
                          key={index}
                          className={`flex items-center border rounded-md p-4 transition-colors ${
                            isSelected ? "border-burgundy bg-burgundy/5" : "border-gray-200 hover:border-burgundy/50"
                          }`}
                          onClick={() => {
                            if (
                              currentOption.items[currentStepIndex].maxSelections &&
                              currentOption.items[currentStepIndex].maxSelections > 1
                            ) {
                              // Handle multiple selections (checkboxes)
                              const values = Array.isArray(currentValue) ? [...currentValue] : []
                              if (isSelected) {
                                const index = values.indexOf(option._id!)
                                if (index !== -1) {
                                  values.splice(index, 1)
                                }
                              } else {
                                if (!values.includes(option._id!)) {
                                  values.push(option._id!)
                                }
                              }
                              handleConfigChange(itemId, values)
                            } else {
                              // Handle single selection (radio)
                              handleConfigChange(itemId, option._id)
                            }
                          }}
                        >
                          <input
                            type={
                              currentOption.items[currentStepIndex].maxSelections &&
                              currentOption.items[currentStepIndex].maxSelections > 1
                                ? "checkbox"
                                : "radio"
                            }
                            id={`option-${index}`}
                            name={`item-${currentStepIndex}`}
                            value={option._id}
                            checked={isSelected}
                            onChange={() => {}} // Handled by the div click
                            className="h-5 w-5 text-burgundy focus:ring-burgundy mr-3"
                          />
                          <label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-800">{option.label}</span>
                              {option.price > 0 && (
                                <span className="text-burgundy font-medium">€{option.price.toFixed(2)}</span>
                              )}
                            </div>
                            {option.description && <p className="text-gray-500 text-sm mt-1">{option.description}</p>}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                )}

              {/* Image selection */}
              {currentOption.items[currentStepIndex]?.type === "image" &&
                currentOption.items[currentStepIndex].options &&
                currentOption.items[currentStepIndex].options.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentOption.items[currentStepIndex].options.map((option, index) => {
                      const itemId = currentOption.items[currentStepIndex]._id || `item-${currentStepIndex}`
                      const currentValue = (configurations[currentOption._id] || {})[itemId]
                      const isSelected = Array.isArray(currentValue)
                        ? currentValue.includes(option._id)
                        : currentValue === option._id

                      return (
                        <div
                          key={index}
                          className={`border rounded-md overflow-hidden cursor-pointer transition-all ${
                            isSelected
                              ? "border-burgundy ring-2 ring-burgundy"
                              : "border-gray-200 hover:border-burgundy"
                          }`}
                          onClick={() => handleConfigChange(itemId, option._id)}
                        >
                          <div className="relative h-48 bg-gray-100">
                            {option.imageUrl ? (
                              <Image
                                src={option.imageUrl || "/placeholder.svg"}
                                alt={option.label}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Info className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-burgundy rounded-full p-1">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-gray-800">{option.label}</h3>
                              {option.price > 0 && (
                                <span className="text-burgundy font-medium">€{option.price.toFixed(2)}</span>
                              )}
                            </div>
                            {option.description && <p className="text-gray-500 text-sm mt-1">{option.description}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Subtotal */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{showingSummary ? "Total" : `Subtotal for ${currentOption.title}`}</span>
            <span className="font-bold text-burgundy">
              €{(showingSummary ? calculateTotal() : subtotals[currentOption._id] || 0).toFixed(2)} Euros
            </span>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-md transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>
              {currentOptionIndex === 0 && currentStepIndex === 0
                ? "Cancel"
                : showingSummary
                  ? "Back to Configuration"
                  : "Previous"}
            </span>
          </button>

          {showingSummary ? (
            <button
              onClick={handleComplete}
              disabled={isSubmitting || !termsAccepted}
              className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="h-5 w-5" />
              <span>{isSubmitting ? "Processing..." : "Place Order"}</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors flex items-center gap-2"
            >
              {currentOptionIndex === standOptions.length - 1 && currentStepIndex === currentOption.items.length - 1 ? (
                <>
                  <ListChecks className="h-5 w-5" />
                  <span>Review Order</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Payment status modal */}
        {paymentModalOpen && paymentId && configId && (
          <PaymentStatusModal
            isOpen={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            paymentId={paymentId}
            ticketId={configId}
            onSuccess={() => {
              setSuccess(true)
              router.refresh()
            }}
            onError={() => {
              setError("Hubo un problema con el pago. Por favor, intente nuevamente.")
            }}
          />
        )}
      </div>
    </div>
  )
}
