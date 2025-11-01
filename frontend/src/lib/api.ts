import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { ApiResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        // Try to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data.data

        // Save new tokens
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  sendOtp: (phone: string) =>
    api.post('/auth/send-otp', { phone }),

  verifyOtp: (phone: string, code: string) =>
    api.post('/auth/verify-otp', { phone, code }),

  setupProfile: (name: string) =>
    api.post('/auth/setup-profile', { name }),

  getMe: () =>
    api.get('/auth/me'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh-token', { refreshToken }),
}

// Wallet API
export const walletApi = {
  getBalance: () =>
    api.get('/wallet/balance'),

  getSummary: () =>
    api.get('/wallet/summary'),

  getAddress: () =>
    api.get('/wallet/address'),

  getTransactions: (limit?: number) =>
    api.get('/wallet/transactions', { params: { limit } }),

  addFunds: (amount: number) =>
    api.post('/wallet/add-funds', { amount }),

  cashOut: (amount: number, bankAccountId?: string) =>
    api.post('/wallet/cash-out', { amount, bankAccountId }),
}

// Splits API
export const splitsApi = {
  create: (data: any) =>
    api.post('/splits/create', data),

  getById: (id: string) =>
    api.get(`/splits/${id}`),

  list: (params?: { status?: string; type?: string; limit?: number; offset?: number }) =>
    api.get('/splits', { params }),

  pay: (id: string) =>
    api.post(`/splits/${id}/pay`),

  cancel: (id: string) =>
    api.put(`/splits/${id}/cancel`),
}

// Groups API
export const groupsApi = {
  list: () =>
    api.get('/groups'),

  create: (data: { name: string; memberIds: string[] }) =>
    api.post('/groups/create', data),

  getById: (id: string) =>
    api.get(`/groups/${id}`),

  addMember: (groupId: string, userId: string) =>
    api.post(`/groups/${groupId}/members`, { userId }),

  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`),

  getBalances: (groupId: string) =>
    api.get(`/groups/${groupId}/balances`),
}

// Transactions API
export const transactionsApi = {
  list: (params?: { type?: string; status?: string; limit?: number; offset?: number }) =>
    api.get('/transactions', { params }),

  getRecent: (limit?: number) =>
    api.get('/transactions/recent', { params: { limit } }),

  getById: (id: string) =>
    api.get(`/transactions/${id}`),
}

// Contacts API
export const contactsApi = {
  list: (params?: { search?: string; recent?: boolean }) =>
    api.get('/contacts', { params }),
}

export default api
