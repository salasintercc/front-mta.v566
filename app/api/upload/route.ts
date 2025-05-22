import { type NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, message: "No se ha proporcionado ningún archivo" }, { status: 400 })
    }

    // Convertir el archivo a un buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convertir el buffer a base64 para Cloudinary
    const base64String = buffer.toString("base64")
    const base64Image = `data:${file.type};base64,${base64String}`

    // Subir la imagen a Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Image,
        {
          folder: "meet-the-architect",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error("Error uploading to Cloudinary:", error)
            reject(error)
          } else {
            resolve(result)
          }
        },
      )
    })

    // Verificar que el resultado tenga la estructura esperada
    if (!result || typeof result !== "object" || !("secure_url" in result)) {
      console.error("Unexpected Cloudinary response:", result)
      return NextResponse.json(
        { success: false, message: "Error al procesar la imagen en Cloudinary" },
        { status: 500 },
      )
    }

    // Extraer la URL segura de la imagen
    const imageUrl = (result as any).secure_url

    // Verificar que la URL sea válida
    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("http")) {
      console.error("Invalid image URL from Cloudinary:", imageUrl)
      return NextResponse.json({ success: false, message: "URL de imagen inválida" }, { status: 500 })
    }

    console.log("Image uploaded successfully:", imageUrl)

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Imagen subida correctamente",
    })
  } catch (error) {
    console.error("Error in upload route:", error)
    return NextResponse.json({ success: false, message: "Error al subir la imagen" }, { status: 500 })
  }
}
