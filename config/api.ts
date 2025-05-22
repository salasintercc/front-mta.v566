// API configuration
export const API_CONFIG = {
  // This should be the URL of your NestJS backend API server, not the Next.js frontend
  // For example: http://localhost:4000 (if your NestJS server runs on port 4000)
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  timeout: 30000, // 30 seconds
  retries: 3,

  // Add a function to get the correct API URL
  getApiUrl: (endpoint: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    return `${baseUrl}${normalizedEndpoint}`
  },

  // Add a function to get the direct backend URL (without /api)
  getBackendUrl: () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
    return baseUrl.replace(/\/api$/, "")
  },

  // Endpoints de la API
  endpoints: {
    // Auth
    login: "/auth/login",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    refreshToken: "/auth/refresh-token",

    // Users
    users: "/users",
    updateUser: (id: string) => `/users/${id}`,
    deleteUser: (id: string) => `/users/${id}`,
    changePassword: (id: string) => `/users/${id}/password`,
    completeProfile: (id: string) => `/users/${id}/complete-profile`,

    // Events
    events: "/events",
    featuredEvents: "/events/featured",
    upcomingEvents: "/events/upcoming",
    pastEvents: "/events/past",

    // Webinars
    webinars: "/webinars",
    featuredWebinars: "/webinars/featured",
    upcomingWebinars: "/webinars/upcoming",
    pastWebinars: "/webinars/past",

    // Speakers
    speakers: "/speakers",
    featuredSpeakers: "/speakers/featured",

    // Blogs
    blogs: "/blogs",
    featuredBlogs: "/blogs/featured",

    // Tickets
    tickets: "/tickets",
    userTickets: (userId: string) => `/users/${userId}/tickets`,
    reserveTicket: (eventId: string) => `/tickets/reserve/${eventId}`,
    ticketDetails: (ticketId: string) => `/tickets/${ticketId}`,

    // Ticket Types
    ticketTypes: "/ticket-types",

    // Site Settings
    siteSettings: "/site-settings",

    // Contact
    contact: "/contact",

    // Upload
    upload: "/upload",

    // Payments (Mollie)
    createPayment: "/payments/create-payment",
    getPaymentStatus: (paymentId: string) => `/payments/${paymentId}`,
    paymentWebhook: "/payments/webhook",
  },
}

console.log("API Config:", API_CONFIG)
