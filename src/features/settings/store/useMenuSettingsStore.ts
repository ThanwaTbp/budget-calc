'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userScopedStorage } from '@/lib/userScopedStorage'

interface IMenuSettingsStore {
  hiddenMenuHrefs: string[]
  onToggleMenu: (href: string) => void
  onShowAllMenus: () => void
  onReset: () => void
}

// เก็บเมนูที่ผู้ใช้เลือกซ่อนไว้ เป็นค่าตั้งค่าประจำเครื่อง ไม่ต้อง sync ขึ้น cloud
export const useMenuSettingsStore = create<IMenuSettingsStore>()(
  persist(
    (set) => ({
      hiddenMenuHrefs: [],

      onToggleMenu: (href) =>
        set((state) => ({
          hiddenMenuHrefs: state.hiddenMenuHrefs.includes(href)
            ? state.hiddenMenuHrefs.filter((hiddenHref) => hiddenHref !== href)
            : [...state.hiddenMenuHrefs, href],
        })),

      onShowAllMenus: () => set({ hiddenMenuHrefs: [] }),

      onReset: () => set({ hiddenMenuHrefs: [] }),
    }),
    {
      name: 'budget-calc:menu-settings',
      // แยกพื้นที่เก็บข้อมูลตามบัญชีผู้ใช้ (key จริงคือ '<name>:<userId>')
      storage: userScopedStorage,
      version: 1,
    },
  ),
)
