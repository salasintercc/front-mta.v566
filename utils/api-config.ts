// API configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  endpoints: {
    login: "/auth/login",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    users: "/users",
    events: "/events",
    webinars: "/webinars",
    tickets: "/tickets",
    ticketTypes: "/ticket-types",
    blogs: "/blogs",
    speakers: "/speakers",
    contact: "/contact",
    contactConsult: "/contact/consult", // Added this endpoint
    contactReserveTicket: "/contact/reserve-ticket", // Added this endpoint
    siteSettings: "/settings", // Endpoint para la configuración del sitio
    googleAuth: "/auth/google", // Endpoint para autenticación con Google
    eventPrograms: "/event-program",
    // Funciones para endpoints dinámicos
    userById: (id: string) => `/users/${id}`,
    updateUser: (id: string) => `/users/${id}`,
    deleteUser: (id: string) => `/users/${id}`,
    changePassword: (id: string) => `/users/${id}/change-password`,
    completeProfile: (id: string) => `/users/${id}/complete-profile`,
    userTickets: (userId: string) => `/users/${userId}/tickets`,
    ticketDetails: (ticketId: string) => `/tickets/${ticketId}`,
    reserveTicket: (contentId: string) => `/tickets/reserve/${contentId}`, // Añadido como función
    // Endpoints para eventos
    eventById: (id: string) => `/events/${id}`,
    updateEvent: (id: string) => `/events/${id}`,
    deleteEvent: (id: string) => `/events/${id}`,
    // Endpoints para webinars
    webinarById: (id: string) => `/webinars/${id}`,
    updateWebinar: (id: string) => `/webinars/${id}`,
    deleteWebinar: (id: string) => `/webinars/${id}`,
    // Endpoints para blogs
    blogById: (id: string) => `/blogs/${id}`,
    updateBlog: (id: string) => `/blogs/${id}`,
    deleteBlog: (id: string) => `/blogs/${id}`,
    // Endpoints para speakers
    speakerById: (id: string) => `/speakers/${id}`,
    updateSpeaker: (id: string) => `/speakers/${id}`,
    deleteSpeaker: (id: string) => `/speakers/${id}`,
    // Endpoints para ticket types
    ticketTypeById: (id: string) => `/ticket-types/${id}`,
    updateTicketType: (id: string) => `/ticket-types/${id}`,
    deleteTicketType: (id: string) => `/ticket-types/${id}`,
  },
}

// Exportar la URL base de la API para uso directo
export const API_URL = API_CONFIG.baseUrl
