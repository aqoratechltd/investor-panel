import axios, { type AxiosInstance, type AxiosError } from 'axios'
import type { ApiResponse } from '@investor-panel/shared'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

// ─────────────────────────────────────────
// Axios Instance
// ─────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      if (token) config.headers.Authorization = `Bearer ${token}`

      const tenantId = localStorage.getItem('tenant_id')
      if (tenantId) config.headers['X-Tenant-ID'] = tenantId
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — refresh Firebase token on 401
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as any

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        // Refresh Firebase ID token
        const { auth } = await import('@/lib/firebase')
        const currentUser = auth.currentUser
        if (!currentUser) throw new Error('No authenticated user')

        const newToken = await currentUser.getIdToken(true)
        localStorage.setItem('access_token', newToken)

        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []

        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

// ─────────────────────────────────────────
// Typed API Methods
// ─────────────────────────────────────────

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>('/auth/login', data),

  register: (data: { email: string; password: string; firstName: string; lastName: string; role: string }) =>
    api.post<ApiResponse>('/auth/register', data),

  refresh: (token: string) =>
    api.post<ApiResponse>('/auth/refresh', {}, { headers: { Authorization: `Bearer ${token}` } }),

  logout: () => api.post<ApiResponse>('/auth/logout'),

  forgotPassword: (email: string) => api.post<ApiResponse>('/auth/forgot-password', { email }),

  me: () => api.get<ApiResponse>('/auth/me'),

  createDemo: () => api.post<{ customToken: string; email: string; uid: string }>('/auth/create-demo'),
}

export const dashboardApi = {
  superAdmin: () => api.get<ApiResponse>('/dashboard/super-admin'),
  seller: () => api.get<ApiResponse>('/dashboard/seller'),
  investor: () => api.get<ApiResponse>('/dashboard/investor'),
}

export const sellersApi = {
  list: (params?: any) => api.get<ApiResponse>('/sellers', { params }),
  get: (id: string) => api.get<ApiResponse>(`/sellers/${id}`),
  approve: (id: string) => api.patch<ApiResponse>(`/sellers/${id}/approve`),
  suspend: (id: string, reason?: string) => api.patch<ApiResponse>(`/sellers/${id}/suspend`, { reason }),
  delete: (id: string) => api.delete<ApiResponse>(`/sellers/${id}`),
}

export const investorsApi = {
  list: (params?: any) => api.get<ApiResponse>('/investors', { params }),
  get: (id: string) => api.get<ApiResponse>(`/investors/${id}`),
  create: (data: any) => api.post<ApiResponse>('/investors', data),
  update: (id: string, data: any) => api.patch<ApiResponse>(`/investors/${id}`, data),
  deactivate: (id: string) => api.patch<ApiResponse>(`/investors/${id}/deactivate`),
}

export const investmentsApi = {
  list: (params?: any) => api.get<ApiResponse>('/investments', { params }),
  get: (id: string) => api.get<ApiResponse>(`/investments/${id}`),
  create: (data: any) => api.post<ApiResponse>('/investments', data),
  update: (id: string, data: any) => api.patch<ApiResponse>(`/investments/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/investments/${id}`),
}

export const coinsApi = {
  list: (params?: any) => api.get<ApiResponse>('/coins', { params }),
  create: (data: any) => api.post<ApiResponse>('/coins', data),
  update: (id: string, data: any) => api.patch<ApiResponse>(`/coins/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/coins/${id}`),
}

export const withdrawalsApi = {
  list: (params?: any) => api.get<ApiResponse>('/withdrawals', { params }),
  request: (data: any) => api.post<ApiResponse>('/withdrawals', data),
  approve: (id: string) => api.patch<ApiResponse>(`/withdrawals/${id}/approve`),
  reject: (id: string, reason: string) => api.patch<ApiResponse>(`/withdrawals/${id}/reject`, { reason }),
}

export const transactionsApi = {
  list: (params?: any) => api.get<ApiResponse>('/transactions', { params }),
}

export const subscriptionsApi = {
  list: (params?: any) => api.get<ApiResponse>('/subscriptions', { params }),
  plans: () => api.get<ApiResponse>('/subscriptions/plans'),
  create: (data: any) => api.post<ApiResponse>('/subscriptions', data),
  cancel: (id: string) => api.patch<ApiResponse>(`/subscriptions/${id}/cancel`),
}

export const adsApi = {
  list: (params?: any) => api.get<ApiResponse>('/ads', { params }),
  create: (data: any) => api.post<ApiResponse>('/ads', data),
  update: (id: string, data: any) => api.patch<ApiResponse>(`/ads/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/ads/${id}`),
}

export const notificationsApi = {
  list: () => api.get<ApiResponse>('/notifications'),
  markRead: (id: string) => api.patch<ApiResponse>(`/notifications/${id}/read`),
  markAllRead: () => api.patch<ApiResponse>('/notifications/read-all'),
}

export default api
