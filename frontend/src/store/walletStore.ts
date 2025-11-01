import { create } from 'zustand'
import { WalletBalance, BalanceSummary, Transaction } from '../types'
import { walletApi } from '../lib/api'

interface WalletState {
  balance: number
  walletAddress: string | null
  summary: BalanceSummary | null
  transactions: Transaction[]
  isLoading: boolean
  lastUpdated: Date | null

  // Actions
  fetchBalance: () => Promise<void>
  fetchSummary: () => Promise<void>
  fetchTransactions: (limit?: number) => Promise<void>
  updateBalance: (amount: number) => void
  reset: () => void
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: 0,
  walletAddress: null,
  summary: null,
  transactions: [],
  isLoading: false,
  lastUpdated: null,

  fetchBalance: async () => {
    try {
      set({ isLoading: true })
      const response = await walletApi.getBalance()
      const data: WalletBalance = response.data.data

      set({
        balance: data.balance,
        walletAddress: data.walletAddress,
        lastUpdated: new Date(),
        isLoading: false,
      })
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      set({ isLoading: false })
    }
  },

  fetchSummary: async () => {
    try {
      const response = await walletApi.getSummary()
      const summary: BalanceSummary = response.data.data

      set({ summary })
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    }
  },

  fetchTransactions: async (limit = 10) => {
    try {
      const response = await walletApi.getTransactions(limit)
      const transactions: Transaction[] = response.data.data.transactions

      set({ transactions })
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    }
  },

  updateBalance: (amount) => {
    set((state) => ({
      balance: state.balance + amount,
    }))
  },

  reset: () => {
    set({
      balance: 0,
      walletAddress: null,
      summary: null,
      transactions: [],
      isLoading: false,
      lastUpdated: null,
    })
  },
}))
