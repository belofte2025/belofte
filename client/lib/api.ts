// client\lib\api.ts
import axios from "axios";

// Use environment variable for API base URL, with fallback
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 150000, // 50 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[API] Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
      });
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token"); // or read from cookies
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        if (process.env.NODE_ENV === "development") {
          console.log("[API] Token attached:", token.substring(0, 20) + "...");
        }
      } else if (process.env.NODE_ENV === "development") {
        console.warn("[API] No token found in localStorage");
      }
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[API] Request error:", error);
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[API] Response:", {
        status: response.status,
        url: response.config.url,
        dataLength: Array.isArray(response.data) ? response.data.length : "N/A",
      });
    }
    return response;
  },
  (error) => {
    // Log error details for debugging
    if (process.env.NODE_ENV === "development") {
      console.error("[API] Response error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        data: error.response?.data,
        message: error.message,
      });
    }

    if (error.response?.status === 401) {
      console.warn("[API] Unauthorized – redirecting to login");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
