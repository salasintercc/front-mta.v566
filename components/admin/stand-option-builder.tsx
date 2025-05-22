"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Upload, X, AlertCircle, Info, Check } from "lucide-react"
import { getAllEvents } from "@/services/event-service"
import {
  createStandOption,
  updateStandOption,
  getStandOptionById,
  type StandItem,
  type StandOptionItem,
} from "@/services/stand-option-service"

interface StandOptionBuilderProps {
  standOptionId?: string
  onSuccess?: () => void
}

export default function StandOptionBuilder({ standOptionId, onSuccess }: StandOptionBuilderProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedEvent, setSelectedEvent] = useState("")
  const [events, setEvents] = useState<any[]>([])
  const [items, setItems] = useState<StandItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File | null }>({})
  const [filePreviewUrls, setFilePreviewUrls] = useState<{ [key: string]: string }>({})

  // Load events and stand option data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No authentication token found")
        }

        // Fetch events
        const eventsData = await getAllEvents(token)
        setEvents(eventsData)

        // If editing an existing stand option, fetch its data
        if (standOptionId) {
          const optionData = await getStandOptionById(standOptionId, token)

          setTitle(optionData.title || "")
          setDescription(optionData.description || "")
          setSelectedEvent(optionData.event || "")
          setItems(optionData.items || [])

          // Set preview URLs for any images in the items
          const previewUrls: { [key: string]: string } = {}
          optionData.items.forEach((item: StandItem, index: number) => {
            if (item.type === "image" && item.options) {
              item.options.forEach((option: StandOptionItem, optionIndex: number) => {
                if (option.imageUrl) {
                  const key = `item-${index}-option-${optionIndex}`
                  previewUrls[key] = option.imageUrl
                }
              })
            }
          })
          setFilePreviewUrls(previewUrls)
        }
      } catch (err: any) {
        console.error("Error loading data:", err)
        setError(err.message || "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [standOptionId])

  // Add a new configuration item
  const addItem = () => {
    setItems([
      ...items,
      {
        label: "",
        type: "text",
        required: true,
        inputPlaceholder: "",
        showImage: false,
        options: [],
      },
    ])
  }

  // Remove an item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Move an item up
  const moveItemUp = (index: number) => {
    if (index === 0) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index - 1]
    newItems[index - 1] = temp

    setItems(newItems)
  }

  // Move an item down
  const moveItemDown = (index: number) => {
    if (index === items.length - 1) return

    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index + 1]
    newItems[index + 1] = temp

    setItems(newItems)
  }

  // Update an item's properties
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]

    // @ts-ignore - We know the field exists
    newItems[index][field] = value

    // If changing type, initialize options array if needed
    if (field === "type" && (value === "select" || value === "image") && !newItems[index].options) {
      newItems[index].options = []
    }

    setItems(newItems)
  }

  // Add an option to a select or image item
  const addOption = (itemIndex: number) => {
    const newItems = [...items]

    if (!newItems[itemIndex].options) {
      newItems[itemIndex].options = []
    }

    newItems[itemIndex].options!.push({
      label: "",
      price: 0,
      imageUrl: "",
    })

    setItems(newItems)
  }

  // Remove an option
  const removeOption = (itemIndex: number, optionIndex: number) => {
    const newItems = [...items]

    newItems[itemIndex].options = newItems[itemIndex].options!.filter((_, i) => i !== optionIndex)

    setItems(newItems)
  }

  // Update an option's properties
  const updateOption = (itemIndex: number, optionIndex: number, field: string, value: any) => {
    const newItems = [...items]

    // @ts-ignore - We know the field exists
    newItems[itemIndex].options![optionIndex][field] = value

    setItems(newItems)
  }

  // Handle file upload for option images
  const handleFileUpload = (itemIndex: number, optionIndex: number, file: File) => {
    const key = `item-${itemIndex}-option-${optionIndex}`

    // Store the file
    setUploadedFiles((prev) => ({
      ...prev,
      [key]: file,
    }))

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file)
    setFilePreviewUrls((prev) => ({
      ...prev,
      [key]: previewUrl,
    }))

    // Update the option with the preview URL for now
    // In a real implementation, you would upload the file and get a URL back
    const newItems = [...items]
    newItems[itemIndex].options![optionIndex].imageUrl = previewUrl
    setItems(newItems)
  }

  // Save the stand option
  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      // Validate required fields
      if (!title) {
        throw new Error("Title is required")
      }

      if (!selectedEvent) {
        throw new Error("Please select an event")
      }

      if (items.length === 0) {
        throw new Error("At least one configuration item is required")
      }

      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (!item.label) {
          throw new Error(`Item #${i + 1} requires a label`)
        }

        if (item.type === "select" || item.type === "image") {
          if (!item.options || item.options.length === 0) {
            throw new Error(`Item "${item.label}" requires at least one option`)
          }

          // Validate each option
          for (let j = 0; j < item.options.length; j++) {
            const option = item.options[j]

            if (!option.label) {
              throw new Error(`Option #${j + 1} in item "${item.label}" requires a label`)
            }

            if (item.type === "image" && !option.imageUrl) {
              throw new Error(`Option "${option.label}" in item "${item.label}" requires an image`)
            }
          }
        }
      }

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      // In a real implementation, you would upload all files here
      // For now, we'll just use the preview URLs

      // Prepare data for submission
      const standOptionData = {
        title,
        description,
        event: selectedEvent,
        items: items.map((item) => ({
          ...item,
          // Ensure options are properly formatted
          options: item.options
            ? item.options.map((option) => ({
                label: option.label,
                imageUrl: option.imageUrl || "",
                price: Number(option.price) || 0,
              }))
            : [],
        })),
      }

      console.log("Sending data:", JSON.stringify(standOptionData, null, 2))

      // Create or update the stand option
      if (standOptionId) {
        await updateStandOption(standOptionId, standOptionData, token)
      } else {
        await createStandOption(standOptionData, token)
      }

      setSuccess(true)

      // Redirect or call success callback
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/admin/dashboard?tab=exhibitors")
        }
      }, 2000)
    } catch (err: any) {
      console.error("Error saving stand option:", err)
      setError(err.message || "Failed to save stand option")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-burgundy border-r-transparent"></div>
        <p className="mt-4 text-gray-300">Loading...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-dark-gray p-6 rounded-lg">
        <div className="text-center py-8">
          <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Stand Option Saved</h2>
          <p className="text-gray-300 mb-6">Your stand option configuration has been successfully saved.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-gray p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">{standOptionId ? "Edit Stand Option" : "Create Stand Option"}</h2>

      {error && (
        <div className="mb-6 p-4 bg-burgundy/20 border border-burgundy rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-burgundy mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-white">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Booth Configuration Options"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event *</label>
            <select
              className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              required
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose of these configuration options"
            rows={3}
          />
        </div>

        {/* Configuration items */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Configuration Steps</h3>
            <button
              onClick={addItem}
              className="bg-burgundy hover:bg-burgundy/90 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Step</span>
            </button>
          </div>

          <div className="space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-8 bg-rich-black rounded-md">
                <Info className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No configuration steps added yet.</p>
                <p className="text-gray-500 text-sm mt-2">Click "Add Step" to create your first configuration step.</p>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={index} className="bg-rich-black p-4 rounded-md border border-gray-700">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold">Step {index + 1}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveItemUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveItemDown(index)}
                        disabled={index === items.length - 1}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 text-burgundy hover:text-burgundy/80"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Label *</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-dark-gray border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
                        value={item.label}
                        onChange={(e) => updateItem(index, "label", e.target.value)}
                        placeholder="e.g., LIGHTING"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Type *</label>
                      <select
                        className="w-full px-3 py-2 bg-dark-gray border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
                        value={item.type}
                        onChange={(e) => updateItem(index, "type", e.target.value)}
                        required
                      >
                        <option value="text">Text Input</option>
                        <option value="select">Selection (Radio/Checkbox)</option>
                        <option value="upload">File Upload</option>
                        <option value="image">Image Selection</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      className="w-full px-3 py-2 bg-dark-gray border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
                      value={item.description || ""}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="Describe this configuration step"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={item.required}
                      onChange={(e) => updateItem(index, "required", e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={`required-${index}`} className="text-sm">
                      Required field
                    </label>
                  </div>

                  {/* Text input specific fields */}
                  {item.type === "text" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Placeholder Text</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-dark-gray border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
                        value={item.inputPlaceholder || ""}
                        onChange={(e) => updateItem(index, "inputPlaceholder", e.target.value)}
                        placeholder="e.g., Enter your company name"
                      />
                    </div>
                  )}

                  {/* Upload specific fields */}
                  {item.type === "upload" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Upload Instructions</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-dark-gray border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
                        value={item.inputPlaceholder || ""}
                        onChange={(e) => updateItem(index, "inputPlaceholder", e.target.value)}
                        placeholder="e.g., Upload your company logo (300 DPI minimum)"
                      />
                    </div>
                  )}

                  {/* Select specific fields */}
                  {item.type === "select" && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Options</label>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`multiple-${index}`}
                              checked={item.maxSelections !== undefined && item.maxSelections > 1}
                              onChange={(e) => {
                                updateItem(index, "maxSelections", e.target.checked ? 999 : undefined)
                              }}
                              className="mr-2"
                            />
                            <label htmlFor={`multiple-${index}`} className="text-sm">
                              Allow multiple selections
                            </label>
                          </div>

                          <button
                            onClick={() => addOption(index)}
                            className="bg-burgundy hover:bg-burgundy/90 text-white px-2 py-1 rounded-md transition-colors flex items-center gap-1 text-xs"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Option</span>
                          </button>
                        </div>
                      </div>

                      {!item.options || item.options.length === 0 ? (
                        <div className="text-center py-4 bg-dark-gray rounded-md border border-gray-700">
                          <p className="text-gray-400 text-sm">No options added yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {item.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex gap-3 items-start bg-dark-gray p-3 rounded-md border border-gray-700"
                            >
                              <div className="flex-grow">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
                                    value={option.label}
                                    onChange={(e) => updateOption(index, optionIndex, "label", e.target.value)}
                                    placeholder="Option label"
                                    required
                                  />

                                  <div className="flex items-center">
                                    <span className="mr-2">€</span>
                                    <input
                                      type="number"
                                      className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
                                      value={option.price || 0}
                                      onChange={(e) =>
                                        updateOption(
                                          index,
                                          optionIndex,
                                          "price",
                                          Number.parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      placeholder="Price"
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                </div>

                                <input
                                  type="text"
                                  className="w-full px-3 py-2 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy"
                                  value={option.description || ""}
                                  onChange={(e) => updateOption(index, optionIndex, "description", e.target.value)}
                                  placeholder="Option description (optional)"
                                />
                              </div>

                              <button
                                onClick={() => removeOption(index, optionIndex)}
                                className="p-1 text-burgundy hover:text-burgundy/80 mt-2"
                                title="Remove option"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image selection specific fields */}
                  {item.type === "image" && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Image Options</label>
                        <button
                          onClick={() => addOption(index)}
                          className="bg-burgundy hover:bg-burgundy/90 text-white px-2 py-1 rounded-md transition-colors flex items-center gap-1 text-xs"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Option</span>
                        </button>
                      </div>

                      {!item.options || item.options.length === 0 ? (
                        <div className="text-center py-4 bg-dark-gray rounded-md border border-gray-700">
                          <p className="text-gray-400 text-sm">No image options added yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {item.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="bg-dark-gray p-3 rounded-md border border-gray-700">
                              <div className="flex justify-between items-start mb-3">
                                <h5 className="text-sm font-medium">Option {optionIndex + 1}</h5>
                                <button
                                  onClick={() => removeOption(index, optionIndex)}
                                  className="p-1 text-burgundy hover:text-burgundy/80"
                                  title="Remove option"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mb-3">
                                <label className="block text-xs mb-1">Image</label>
                                <div className="border border-gray-700 rounded-md overflow-hidden aspect-square relative">
                                  {option.imageUrl ? (
                                    <>
                                      <Image
                                        src={option.imageUrl || "/placeholder.svg"}
                                        alt={option.label || "Option image"}
                                        fill
                                        className="object-cover"
                                      />
                                      <button
                                        className="absolute top-2 right-2 bg-burgundy rounded-full p-1"
                                        onClick={() => {
                                          // Remove the image
                                          const key = `item-${index}-option-${optionIndex}`
                                          setUploadedFiles((prev) => ({ ...prev, [key]: null }))

                                          // Remove the preview URL
                                          setFilePreviewUrls((prev) => {
                                            const updated = { ...prev }
                                            delete updated[key]
                                            return updated
                                          })

                                          // Update the option
                                          updateOption(index, optionIndex, "imageUrl", "")
                                        }}
                                      >
                                        <X className="h-3 w-3 text-white" />
                                      </button>
                                    </>
                                  ) : (
                                    <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                                      <Upload className="h-8 w-8 text-gray-500 mb-2" />
                                      <span className="text-xs text-gray-400">Upload image</span>
                                      <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            handleFileUpload(index, optionIndex, e.target.files[0])
                                          }
                                        }}
                                        accept="image/*"
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-2">
                                <div>
                                  <label className="block text-xs mb-1">Label</label>
                                  <input
                                    type="text"
                                    className="w-full px-3 py-1.5 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy text-sm"
                                    value={option.label}
                                    onChange={(e) => updateOption(index, optionIndex, "label", e.target.value)}
                                    placeholder="Option label"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs mb-1">Price (€)</label>
                                  <input
                                    type="number"
                                    className="w-full px-3 py-1.5 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy text-sm"
                                    value={option.price || 0}
                                    onChange={(e) =>
                                      updateOption(index, optionIndex, "price", Number.parseFloat(e.target.value) || 0)
                                    }
                                    placeholder="Price"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs mb-1">Description (optional)</label>
                                  <input
                                    type="text"
                                    className="w-full px-3 py-1.5 bg-rich-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-burgundy text-sm"
                                    value={option.description || ""}
                                    onChange={(e) => updateOption(index, optionIndex, "description", e.target.value)}
                                    placeholder="Brief description"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-burgundy hover:bg-burgundy/90 text-white px-6 py-2 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{isSaving ? "Saving..." : "Save Stand Option"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
