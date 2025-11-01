import { create } from 'zustand'
import { SplitDraft } from '../types'

interface SplitState {
  draft: SplitDraft | null
  currentStep: number

  // Actions
  saveDraft: (data: Partial<SplitDraft>) => void
  nextStep: () => void
  previousStep: () => void
  clearDraft: () => void
  loadDraft: () => void
  setStep: (step: number) => void
}

const DRAFT_KEY = 'split_draft'

export const useSplitStore = create<SplitState>((set, get) => ({
  draft: null,
  currentStep: 1,

  saveDraft: (data) => {
    const currentDraft = get().draft || {
      amount: 0,
      description: '',
      selectedContacts: [],
      splitType: 'EQUAL' as const,
      includeSelf: false,
    }

    const newDraft = { ...currentDraft, ...data }
    set({ draft: newDraft })

    // Save to localStorage
    localStorage.setItem(DRAFT_KEY, JSON.stringify(newDraft))
  },

  nextStep: () => {
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 4),
    }))
  },

  previousStep: () => {
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    }))
  },

  clearDraft: () => {
    set({ draft: null, currentStep: 1 })
    localStorage.removeItem(DRAFT_KEY)
  },

  loadDraft: () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        set({ draft })
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
  },

  setStep: (step) => {
    set({ currentStep: step })
  },
}))
