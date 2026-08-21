'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_PALETTE, PALETTE_STORAGE_KEY, type PaletteId } from '@/constants/palettes'

interface IPaletteStore {
  palette: PaletteId
  onSelectPalette: (palette: PaletteId) => void
}

// ผูกค่า palette เข้ากับ attribute data-palette บน <html> เพื่อให้ CSS สลับชุดสีทั้งแอป
function applyPaletteToDocument(palette: PaletteId) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.palette = palette
}

export const usePaletteStore = create<IPaletteStore>()(
  persist(
    (set) => ({
      palette: DEFAULT_PALETTE,
      onSelectPalette: (palette) => {
        applyPaletteToDocument(palette)
        set({ palette })
      },
    }),
    {
      name: PALETTE_STORAGE_KEY,
      version: 1,
      // ค่าที่อ่านกลับจาก localStorage ต้องถูกนำไปแปะบน <html> ทันทีหลัง rehydrate
      onRehydrateStorage: () => (state) => {
        if (state) applyPaletteToDocument(state.palette)
      },
    },
  ),
)
