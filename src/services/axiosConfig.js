import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – inject auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('staff_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // CSRF token from cookie/meta
    const csrf = document.cookie.match(/csrfToken=([^;]+)/)?.[1];
    if (csrf) config.headers['X-CSRF-Token'] = csrf;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – auto-logout on 401
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('staff_token');
      localStorage.removeItem('staff_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
