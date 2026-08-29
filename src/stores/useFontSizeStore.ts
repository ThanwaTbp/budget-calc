'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_FONT_SIZE, FONT_SIZE_STORAGE_KEY, type FontSizeId } from '@/constants/fontSizes'

interface IFontSizeStore {
  fontSize: FontSizeId
  onSelectFontSize: (fontSize: FontSizeId) => void
}

function applyFontSizeToDocument(fontSize: FontSizeId) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.fontSize = fontSize
}

export const useFontSizeStore = create<IFontSizeStore>()(
  persist(
    (set) => ({
      fontSize: DEFAULT_FONT_SIZE,
      onSelectFontSize: (fontSize) => {
        applyFontSizeToDocument(fontSize)
        set({ fontSize })
      },
    }),
    {
      name: FONT_SIZE_STORAGE_KEY,
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) applyFontSizeToDocument(state.fontSize)
      },
    },
  ),
)
