import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userScopedStorage } from '@/lib/userScopedStorage'
import type { IRecurringItem } from '@/types/recurring'
import { createId } from '@/utils/id'
import type { IRecurringInput } from '@/features/recurring/type'
import { enqueueSyncOperation } from '@/features/sync/services/syncQueue'

interface IRecurringStore {
  items: IRecurringItem[]
  onCreate: (input: IRecurringInput) => void
  onUpdate: (id: string, input: IRecurringInput) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string) => void
  // ทำเครื่องหมายว่าลงรายการของเดือนนี้ไปแล้ว กันลงรายการอัตโนมัติซ้ำในเดือนเดียวกัน
  onMarkPosted: (id: string, yearMonth: string) => void
  onReset: () => void
  // แทนที่ items ทั้งหมดด้วยข้อมูลจาก Appwrite แบบเงียบ ห้ามยิงกลับเข้าคิว sync (กันลูปอัปโหลดซ้ำ)
  onReplaceAll: (items: IRecurringItem[]) => void
}

export const useRecurringStore = create<IRecurringStore>()(
  persist(
    (set, get) => ({
      items: [],

      onCreate: (input) => {
        const newItem: IRecurringItem = {
          ...input,
          id: createId(),
          lastPostedYearMonth: '',
          createdAt: new Date().toISOString(),
        }

        set((state) => ({ items: [...state.items, newItem] }))
        enqueueSyncOperation({ kind: 'recurring', action: 'upsert', id: newItem.id, payload: newItem })
      },

      onUpdate: (id, input) => {
        let updatedItem: IRecurringItem | null = null

        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item
            updatedItem = { ...item, ...input }
            return updatedItem
          }),
        }))

        if (updatedItem) {
          enqueueSyncOperation({ kind: 'recurring', action: 'upsert', id, payload: updatedItem })
        }
      },

      onDelete: (id) => {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
        enqueueSyncOperation({ kind: 'recurring', action: 'delete', id })
      },

      onToggleActive: (id) => {
        const item = get().items.find((recurringItem) => recurringItem.id === id)
        if (!item) return

        const updatedItem: IRecurringItem = { ...item, isActive: !item.isActive }

        set((state) => ({
          items: state.items.map((recurringItem) => (recurringItem.id === id ? updatedItem : recurringItem)),
        }))
        enqueueSyncOperation({ kind: 'recurring', action: 'upsert', id, payload: updatedItem })
      },

      onMarkPosted: (id, yearMonth) => {
        const item = get().items.find((recurringItem) => recurringItem.id === id)
        if (!item) return

        const updatedItem: IRecurringItem = { ...item, lastPostedYearMonth: yearMonth }

        set((state) => ({
          items: state.items.map((recurringItem) => (recurringItem.id === id ? updatedItem : recurringItem)),
        }))
        enqueueSyncOperation({ kind: 'recurring', action: 'upsert', id, payload: updatedItem })
      },

      onReset: () => set({ items: [] }),

      onReplaceAll: (items) => set({ items }),
    }),
    {
      name: 'budget-calc:recurring',
      // แยกพื้นที่เก็บข้อมูลตามบัญชีผู้ใช้ (key จริงคือ '<name>:<userId>')
      storage: userScopedStorage,
      version: 1,
    },
  ),
)
