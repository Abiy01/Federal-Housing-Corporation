import axios from 'axios';

// API Base URL - uses env variable or falls back to localhost
// Trim trailing slash so both "https://api.example.com" and "https://api.example.com/" work.
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const normalizedApiBaseUrl = rawApiBaseUrl?.replace(/\/+$/, '');
const API_BASE_URL = normalizedApiBaseUrl
  ? `${normalizedApiBaseUrl}/api`
  : 'http://localhost:4000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach auth token ──────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('buildestate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-logout on 401 ────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('buildestate_token');
      // Optionally redirect to login
      // window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════
// API Endpoints — aligned with backend routes
// ═══════════════════════════════════════════════════════════

// User Authentication
// Backend register expects { name, email, password }
// We transform fullName → name here so the UI can keep using fullName
export const userAPI = {
  register: (data: { fullName: string; email: string; phone: string; password: string }) =>
    apiClient.post('/users/register', {
      name: data.fullName,
      email: data.email,
      password: data.password,
    }),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/users/login', data),

  forgotPassword: (email: string) =>
    apiClient.post('/users/forgot', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post(`/users/reset/${token}`, { password }),

  verifyEmail: (token: string) =>
    apiClient.get(`/users/verify/${token}`),

  getProfile: () =>
    apiClient.get('/users/me'),
};

// Properties (CRUD — admin-managed listings)
export const propertiesAPI = {
  getAll: () =>
    apiClient.get('/products/list'),

  getById: (id: string) =>
    apiClient.get(`/products/single/${id}`),
};

// User-submitted property listings (require auth)
export const userListingsAPI = {
  create: (formData: FormData) =>
    apiClient.post('/user/properties', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getMyListings: () =>
    apiClient.get('/user/properties'),

  update: (id: string, formData: FormData) =>
    apiClient.put(`/user/properties/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) =>
    apiClient.delete(`/user/properties/${id}`),
};

// Appointments (supports guest + auth bookings)
export const appointmentsAPI = {
  schedule: (data: {
    propertyId: string;
    date: string;
    time: string;
    name: string;
    email: string;
    phone: string;
    message?: string;
  }) =>
    apiClient.post('/appointments/schedule', data),

  getByUser: () =>
    apiClient.get('/appointments/user'),

  cancel: (id: string, reason?: string) =>
    apiClient.put(`/appointments/cancel/${id}`, { cancelReason: reason }),
};

// Contact form — Web3Forms (https://web3forms.com). Set VITE_WEB3FORMS_ACCESS_KEY in .env.local
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

export const contactAPI = {
  submit: async (data: { name: string; email: string; phone: string; message: string }) => {
    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY?.trim();
    if (!accessKey) {
      throw new Error(
        'Contact form is not configured. Add VITE_WEB3FORMS_ACCESS_KEY to .env.local (free key at https://web3forms.com).'
      );
    }

    const response = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `BuildEstate — Contact: ${data.name}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
      }),
    });

    const json = (await response.json()) as { success?: boolean; message?: string };

    if (!response.ok || json.success === false) {
      throw new Error(json.message || 'Failed to send your message. Please try again.');
    }

    return { data: { success: true as const, message: json.message } };
  },
};

// Maintenance Requests
export const maintenanceAPI = {
  create: (data: {
    title: string;
    description: string;
    propertyId: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) => apiClient.post('/maintenance', data),

  getMy: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/maintenance/my', { params }),

  getAssigned: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/maintenance/assigned', { params }),

  updateStatus: (
    id: string,
    data:
      | {
          status: 'in_progress';
          completionNotes?: string;
          completionCost?: number | string;
        }
      | FormData
  ) => {
    if (data instanceof FormData) {
      return apiClient.put(`/maintenance/${id}/status`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return apiClient.put(`/maintenance/${id}/status`, data);
  },

  getAudits: (params?: { auditStatus?: string }) =>
    apiClient.get('/maintenance/audits', { params }),

  reviewAudit: (id: string, data: { auditStatus: 'approved' | 'rejected'; note?: string }) =>
    apiClient.put(`/maintenance/${id}/audit`, data),
};

export const financeAuditAPI = {
  getSummary: () => apiClient.get('/finance-audits/summary'),
  getPayments: (params?: { auditStatus?: string }) =>
    apiClient.get('/finance-audits/payments', { params }),
  reviewPayment: (id: string, data: { auditStatus: 'approved' | 'rejected'; note?: string }) =>
    apiClient.put(`/finance-audits/payments/${id}/review`, data),
  getLeases: (params?: { auditStatus?: string }) =>
    apiClient.get('/finance-audits/leases', { params }),
  reviewLease: (id: string, data: { auditStatus: 'approved' | 'rejected'; note?: string }) =>
    apiClient.put(`/finance-audits/leases/${id}/review`, data),
  getTransactions: (params?: { auditStatus?: string }) =>
    apiClient.get('/finance-audits/transactions', { params }),
  reviewTransaction: (id: string, data: { auditStatus: 'approved' | 'rejected'; note?: string }) =>
    apiClient.put(`/finance-audits/transactions/${id}/review`, data),
};

// Rent/Buy transaction requests
export const transactionsAPI = {
  createRequest: (data: {
    propertyId: string;
    requestType: 'rent' | 'buy';
    paymentId: string;
    message?: string;
  }) => apiClient.post('/transactions', data),

  getMyRequests: () => apiClient.get('/transactions/my'),
};

// Payments (simulation + ledger)
export const paymentsAPI = {
  getMethods: () => apiClient.get('/payments/methods'),

  createPayment: (formData: FormData) =>
    apiClient.post('/payments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getMyPayments: () => apiClient.get('/payments/my'),
};

export const leasesAPI = {
  getMyLeases: () => apiClient.get('/leases/my'),
  getMyDues: () => apiClient.get('/leases/my/dues'),
  requestRenewal: (formData: FormData) =>
    apiClient.post('/leases/renew', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  requestEndContract: (data: { leaseId: string; note?: string }) => apiClient.post('/leases/end-request', data),
};

export const notificationsAPI = {
  getMyNotifications: () => apiClient.get('/notifications/my'),
  markRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
  markAllRead: () => apiClient.put('/notifications/read-all'),
};

export default apiClient;

