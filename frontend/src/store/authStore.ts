import { create } from 'zustand'
import { User } from '../types'
import { authApi } from '../lib/api'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: User) => void
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    set({ accessToken, refreshToken, isAuthenticated: true })
  },

  setUser: (user) => {
    set({ user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    })
  },

  initialize: async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      const refreshToken = localStorage.getItem('refreshToken')

      if (accessToken && refreshToken) {
        set({ accessToken, refreshToken })

        // Fetch current user
        const response = await authApi.getMe()
        const user = response.data.data.user

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      get().logout()
      set({ isLoading: false })
    }
  },
}))
