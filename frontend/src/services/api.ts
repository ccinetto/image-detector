import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
};

export const questionsService = {
  getAll: (limit?: number, lastKey?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (lastKey) params.append('lastKey', lastKey);
    return api.get(`/questions?${params.toString()}`);
  },
  getById: (id: string) => api.get(`/questions/${id}`),
  create: (formData: FormData) => api.post('/questions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: string, formData: FormData) => api.put(`/questions/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id: string) => api.delete(`/questions/${id}`),
};

export default api;
