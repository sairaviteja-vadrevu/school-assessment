const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

/**
 * Get JWT token from localStorage
 */
const getToken = () => {
  return localStorage.getItem("token");
};

/**
 * Set JWT token in localStorage
 */
const setToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
};

/**
 * Make API request with automatic token attachment
 */
const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      setToken(null);
      window.location.href = "/login";
      return null;
    }

    // Handle other error responses
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    // Handle empty responses
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
};

/**
 * GET request
 */
const get = (endpoint) => {
  return makeRequest(endpoint, {
    method: "GET",
  });
};

/**
 * POST request
 */
const post = (endpoint, data) => {
  return makeRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * PUT request
 */
const put = (endpoint, data) => {
  return makeRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request
 */
const del = (endpoint) => {
  return makeRequest(endpoint, {
    method: "DELETE",
  });
};

/**
 * PATCH request
 */
const patch = (endpoint, data) => {
  return makeRequest(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export default {
  get,
  post,
  put,
  delete: del,
  patch,
  getToken,
  setToken,
  makeRequest,
};

export { get, post, put, del as delete, patch, getToken, setToken, makeRequest };
