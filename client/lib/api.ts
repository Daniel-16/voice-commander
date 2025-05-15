import { API_URL } from "./config";

interface RequestOptions extends RequestInit {
  data?: any;
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const { data, ...customOptions } = options;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(customOptions.headers || {}),
    },
  };

  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...customOptions,
  };

  if (data) {
    mergedOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, mergedOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

export const api = {
  get: (endpoint: string, options?: RequestOptions) =>
    request(endpoint, { ...options, method: "GET" }),

  post: (endpoint: string, data: any, options?: RequestOptions) =>
    request(endpoint, { ...options, method: "POST", data }),

  put: (endpoint: string, data: any, options?: RequestOptions) =>
    request(endpoint, { ...options, method: "PUT", data }),

  delete: (endpoint: string, options?: RequestOptions) =>
    request(endpoint, { ...options, method: "DELETE" }),
};

export default api;
