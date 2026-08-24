import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userScopedStorage } from '@/lib/userScopedStorage'
import type { IBudget } from '@/types/budget'
import { createId } from '@/utils/id'
import { enqueueSyncOperation } from '@/features/sync/services/syncQueue'

interface IBudgetStore {
  budgets: IBudget[]
  // หนึ่งหมวดมีได้แค่หนึ่งวงเงิน มีอยู่แล้วให้อัปเดตจำนวนเงิน (คง id/createdAt เดิม) ไม่มีให้สร้างใหม่
  onUpsert: (categoryId: string, amount: number) => void
  onDelete: (id: string) => void
  onReset: () => void
  // แทนที่ budgets ทั้งหมดด้วยข้อมูลจาก Appwrite แบบเงียบ ห้ามยิงกลับเข้าคิว sync (กันลูปอัปโหลดซ้ำ)
  onReplaceAll: (budgets: IBudget[]) => void
}

export const useBudgetStore = create<IBudgetStore>()(
  persist(
    (set, get) => ({
      budgets: [],

      onUpsert: (categoryId, amount) => {
        const existingBudget = get().budgets.find((budget) => budget.categoryId === categoryId)

        const nextBudget: IBudget = existingBudget
          ? { ...existingBudget, amount }
          : { id: createId(), categoryId, amount, createdAt: new Date().toISOString() }

        set((state) => ({
          budgets: existingBudget
            ? state.budgets.map((budget) => (budget.id === nextBudget.id ? nextBudget : budget))
            : [...state.budgets, nextBudget],
        }))
        enqueueSyncOperation({ kind: 'budget', action: 'upsert', id: nextBudget.id, payload: nextBudget })
      },

      onDelete: (id) => {
        set((state) => ({ budgets: state.budgets.filter((budget) => budget.id !== id) }))
        enqueueSyncOperation({ kind: 'budget', action: 'delete', id })
      },

      onReset: () => set({ budgets: [] }),

      onReplaceAll: (budgets) => set({ budgets }),
    }),
    {
      name: 'budget-calc:budgets',
      // แยกพื้นที่เก็บข้อมูลตามบัญชีผู้ใช้ (key จริงคือ '<name>:<userId>')
      storage: userScopedStorage,
      version: 1,
    },
  ),
)
