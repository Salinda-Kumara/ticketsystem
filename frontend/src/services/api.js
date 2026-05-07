import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ─── Users ────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getAgents: () => api.get('/users/agents/list'),
};

// ─── Tickets ──────────────────────
export const ticketsAPI = {
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  updateStatus: (id, status) => api.put(`/tickets/${id}/status`, { status }),
  assign: (id, assigneeId) => api.put(`/tickets/${id}/assign`, { assigneeId }),
  uploadFiles: (id, formData) => api.post(`/tickets/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// ─── Categories ───────────────────
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ─── Departments ──────────────────
export const departmentsAPI = {
  getAll: () => api.get('/departments'),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// ─── Comments ─────────────────────
export const commentsAPI = {
  getByTicket: (ticketId) => api.get(`/comments/${ticketId}`),
  create: (ticketId, data) => api.post(`/comments/${ticketId}`, data),
};

// ─── Notifications ────────────────
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ─── Dashboard ────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// ─── Reports ──────────────────────
export const reportsAPI = {
  getMonthly: (params) => api.get('/reports/monthly', { params }),
  exportTickets: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
};

// ─── SLA Rules ────────────────────
export const slaAPI = {
  getAll: () => api.get('/sla-rules'),
  create: (data) => api.post('/sla-rules', data),
  update: (id, data) => api.put(`/sla-rules/${id}`, data),
  delete: (id) => api.delete(`/sla-rules/${id}`),
};

// ─── Knowledge Base ───────────────
export const kbAPI = {
  getAll: (params) => api.get('/knowledge', { params }),
  getById: (id) => api.get(`/knowledge/${id}`),
  create: (data) => api.post('/knowledge', data),
  update: (id, data) => api.put(`/knowledge/${id}`, data),
  delete: (id) => api.delete(`/knowledge/${id}`),
};

// ─── Assets ───────────────────────
export const assetsAPI = {
  getAll: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  addMaintenance: (id, data) => api.post(`/assets/${id}/maintenance`, data),
  bulkUpload: (assets) => api.post('/assets/bulk', { assets }),
};

// ─── Audit ────────────────────────
export const auditAPI = {
  getLogs: (params) => api.get('/audit/logs', { params }),
  getLoginHistory: () => api.get('/audit/login-history'),
};

export default api;
