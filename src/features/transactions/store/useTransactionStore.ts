import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ICategory, ITransaction } from '@/types/finance'
import { DEFAULT_CATEGORIES, PAYROLL_CATEGORY_ID } from '@/constants/categories'
import { createId } from '@/utils/id'
import type { IPayrollExpenseInput, ITransactionInput } from '@/features/transactions/type'

export type { ITransactionInput } from '@/features/transactions/type'

interface ITransactionStore {
  transactions: ITransaction[]
  categories: ICategory[]
  onCreate: (input: ITransactionInput) => void
  onUpdate: (id: string, input: ITransactionInput) => void
  onDelete: (id: string) => void
  onReset: () => void
  onSyncPayrollExpense: (input: IPayrollExpenseInput) => void
  onRemovePayrollExpense: (payrollEntryId: string) => void
}

export const useTransactionStore = create<ITransactionStore>()(
  persist(
    (set) => ({
      transactions: [],
      categories: DEFAULT_CATEGORIES,

      onCreate: (input) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              ...input,
              id: createId(),
              createdAt: new Date().toISOString(),
              source: 'manual',
              sourceRefId: null,
            },
          ],
        })),

      onUpdate: (id, input) =>
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === id ? { ...transaction, ...input } : transaction,
          ),
        })),

      onDelete: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        })),

      onReset: () => set({ transactions: [] }),

      // รอบจ่ายค่าจ้างหนึ่งรอบผูกกับรายจ่ายหนึ่งรายการเสมอ (1:1 ผ่าน sourceRefId)
      // บันทึกรอบจ่ายซ้ำจึงต้องอัปเดตรายการเดิม ไม่ใช่สร้างใหม่ ไม่งั้นรายจ่ายจะซ้ำซ้อน
      onSyncPayrollExpense: (input) =>
        set((state) => {
          const existingIndex = state.transactions.findIndex(
            (transaction) =>
              transaction.source === 'payroll' && transaction.sourceRefId === input.payrollEntryId,
          )

          // ยอดสุทธิไม่เป็นบวกก็ไม่ต้องมีรายจ่าย ให้ลบรายการที่ผูกไว้ทิ้ง
          if (input.amount <= 0) {
            return {
              transactions: state.transactions.filter(
                (transaction) =>
                  !(
                    transaction.source === 'payroll' &&
                    transaction.sourceRefId === input.payrollEntryId
                  ),
              ),
            }
          }

          if (existingIndex === -1) {
            return {
              transactions: [
                ...state.transactions,
                {
                  id: createId(),
                  type: 'expense' as const,
                  amount: input.amount,
                  categoryId: PAYROLL_CATEGORY_ID,
                  note: input.note,
                  date: input.date,
                  createdAt: new Date().toISOString(),
                  source: 'payroll' as const,
                  sourceRefId: input.payrollEntryId,
                },
              ],
            }
          }

          const nextTransactions = [...state.transactions]
          nextTransactions[existingIndex] = {
            ...nextTransactions[existingIndex],
            amount: input.amount,
            note: input.note,
            date: input.date,
          }

          return { transactions: nextTransactions }
        }),

      onRemovePayrollExpense: (payrollEntryId) =>
        set((state) => ({
          transactions: state.transactions.filter(
            (transaction) =>
              !(transaction.source === 'payroll' && transaction.sourceRefId === payrollEntryId),
          ),
        })),
    }),
    {
      name: 'budget-calc:transactions',
      version: 2,
      // categories มาจาก DEFAULT_CATEGORIES เสมอ ไม่ persist เพื่อให้อัปเดตตามโค้ดได้
      partialize: (state) => ({ transactions: state.transactions }),
      // ข้อมูลเวอร์ชันเก่ายังไม่มี source/sourceRefId ให้ถือว่าเป็นรายการที่ผู้ใช้บันทึกเอง
      migrate: (persistedState, version) => {
        if (version >= 2) return persistedState as { transactions: ITransaction[] }

        const legacyState = persistedState as { transactions?: Partial<ITransaction>[] }

        return {
          transactions: (legacyState.transactions ?? []).map((transaction) => ({
            ...transaction,
            source: 'manual',
            sourceRefId: null,
          })) as ITransaction[],
        }
      },
    },
  ),
)
