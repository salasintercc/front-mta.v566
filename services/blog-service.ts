import { post, patch, del } from "@/utils/api"
import { API_CONFIG } from "@/config/api"

// Interfaces para los datos de blog
export interface Blog {
  _id: string
  title: string
  content: string
  author: string
  isPublished: boolean
  image?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateBlogDto {
  title: string
  content: string
  author: string
  isPublished?: boolean
  image?: string
}

export interface UpdateBlogDto {
  title?: string
  content?: string
  author?: string
  isPublished?: boolean
  image?: string
}

// Update the getAllBlogs function to not require a token
export async function getAllBlogs(): Promise<Blog[]> {
  try {
    // Make a direct fetch request to the public endpoint
    const response = await fetch(`${API_CONFIG.baseUrl}/blog`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching blogs: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching blogs:", error)
    throw error
  }
}

// Update the getBlogById function to require a token only if provided
export async function getBlogById(id: string, token?: string): Promise<Blog> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Only add the Authorization header if a token is provided
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(`${API_CONFIG.baseUrl}/blog/${id}`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      throw new Error(`Error fetching blog with ID ${id}: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching blog with ID ${id}:`, error)
    throw error
  }
}

// Asegurarnos de que el servicio de blog maneje correctamente los errores y validaciones

// Modificar la función createBlog para validar la imagen
export async function createBlog(blogData: CreateBlogDto, token: string): Promise<Blog> {
  try {
    // Validar que la imagen sea una URL válida
    if (blogData.image && !isValidUrl(blogData.image)) {
      throw new Error("La imagen debe ser una URL válida")
    }

    return await post<Blog>("/blog", blogData, token)
  } catch (error) {
    console.error("Error creating blog:", error)
    throw error
  }
}

export async function updateBlogStatus(id: string, isPublished: boolean, token: string): Promise<Blog> {
  try {
    const response = await patch<Blog>(`/blog/${id}`, { isPublished }, token)
    return response
  } catch (error) {
    console.error(`Error updating blog status with ID ${id}:`, error)
    throw error
  }
}

// Modificar la función updateBlog para validar la imagen
export async function updateBlog(id: string, blogData: UpdateBlogDto, token: string): Promise<Blog> {
  try {
    // Validar que la imagen sea una URL válida
    if (blogData.image && !isValidUrl(blogData.image)) {
      throw new Error("La imagen debe ser una URL válida")
    }

    // Verificar si solo estamos actualizando el estado de publicación
    if (Object.keys(blogData).length === 1 && "isPublished" in blogData) {
      return await updateBlogStatus(id, blogData.isPublished, token)
    }

    // Usar el nuevo endpoint general para actualizar todos los campos
    return await patch<Blog>(`/blog/${id}`, blogData, token)
  } catch (error) {
    console.error(`Error updating blog with ID ${id}:`, error)
    throw error
  }
}

// Eliminar un blog
export async function deleteBlog(id: string, token: string): Promise<{ message: string }> {
  try {
    return await del<{ message: string }>(`/blog/${id}`, token)
  } catch (error) {
    console.error(`Error deleting blog with ID ${id}:`, error)
    throw error
  }
}

// Formatear fecha para mostrar
export function formatBlogDate(dateString: string | Date): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return String(dateString)
  }
}

// Función auxiliar para validar URLs
function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}
