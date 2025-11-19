export const BASE_URL = "http://localhost:8000";

export const API_PATHS = {
  AUTH: {
    REGISTER: "api/auth/register", // Sign up
    LOGIN: "api/auth/login", // Authenticate user & return JWT token
    GET_PROFILE: "api/auth/me", // Get logged-in user's profile
    UPDATE_PROFILE: "api/auth/me", // Update logged-in user's profile (PUT request)
  },

  INVOICES: {
    CREATE: "api/invoices/",
    GET_ALL_INVOICES: "api/invoices/",
    GET_INVOICE_BY_ID: (id) => `api/invoices/${id}`,
    UPDATE_INVOICE: (id) => `api/invoices/${id}`,
    UPDATE_INVOICE_BY_ID: (id) => `api/invoices/${id}`,
    DELETE_INVOICE: (id) => `api/invoices/${id}`,
  },

  AI: {
    PARSE_INVOICE_TEXT: "api/ai/parse-text",
    GENERATE_REMINDER: "api/ai/generate-reminder",
    GET_DASHBOARD_SUMMARY: "api/ai/dashboard-summary",
  },
};
