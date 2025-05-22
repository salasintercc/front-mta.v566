/**
 * Utilidades para trabajar con mapas y ubicaciones
 */

/**
 * Genera una URL para el iframe de Google Maps basada en una dirección
 *
 * @param address La dirección a mostrar en el mapa
 * @returns URL para el iframe de Google Maps
 */
export function generateGoogleMapsUrl(address: string): string {
  // Limpiar y formatear la dirección para la URL
  const formattedAddress = encodeURIComponent(address.replace(/\n/g, ", "))

  // Usar la API de embed de Google Maps
  // Nota: En producción, deberías usar tu propia API key de Google Maps
  return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${formattedAddress}`
}

/**
 * Genera una URL para abrir Google Maps en una nueva pestaña
 *
 * @param address La dirección a mostrar en el mapa
 * @returns URL para abrir Google Maps
 */
export function generateGoogleMapsLinkUrl(address: string): string {
  const formattedAddress = encodeURIComponent(address.replace(/\n/g, ", "))
  return `https://www.google.com/maps/search/?api=1&query=${formattedAddress}`
}
