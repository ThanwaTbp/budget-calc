import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userScopedStorage } from '@/lib/userScopedStorage'
import type { ICategory, ITransaction } from '@/types/finance'
import { DEFAULT_CATEGORIES, PAYROLL_CATEGORY_ID } from '@/constants/categories'
import { createId } from '@/utils/id'
import type { IPayrollExpenseInput, ITransactionInput } from '@/features/transactions/type'
import { enqueueSyncOperation } from '@/features/sync/services/syncQueue'
import type { ISyncOperation } from '@/features/sync/services/syncQueue'

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
  // แทนที่ transactions ทั้งหมดด้วยข้อมูลจาก Appwrite แบบเงียบ ห้ามยิงกลับเข้าคิว sync (กันลูปอัปโหลดซ้ำ)
  onReplaceAll: (transactions: ITransaction[]) => void
}

export const useTransactionStore = create<ITransactionStore>()(
  persist(
    (set) => ({
      transactions: [],
      categories: DEFAULT_CATEGORIES,

      onCreate: (input) => {
        const newTransaction: ITransaction = {
          ...input,
          id: createId(),
          createdAt: new Date().toISOString(),
          source: 'manual',
          sourceRefId: null,
        }

        set((state) => ({ transactions: [...state.transactions, newTransaction] }))
        enqueueSyncOperation({
          kind: 'transaction',
          action: 'upsert',
          id: newTransaction.id,
          payload: newTransaction,
        })
      },

      onUpdate: (id, input) => {
        let updatedTransaction: ITransaction | null = null

        set((state) => ({
          transactions: state.transactions.map((transaction) => {
            if (transaction.id !== id) return transaction
            updatedTransaction = { ...transaction, ...input }
            return updatedTransaction
          }),
        }))

        if (updatedTransaction) {
          enqueueSyncOperation({ kind: 'transaction', action: 'upsert', id, payload: updatedTransaction })
        }
      },

      onDelete: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        }))
        enqueueSyncOperation({ kind: 'transaction', action: 'delete', id })
      },

      onReset: () => set({ transactions: [] }),

      // รอบจ่ายค่าจ้างหนึ่งรอบผูกกับรายจ่ายหนึ่งรายการเสมอ (1:1 ผ่าน sourceRefId)
      // บันทึกรอบจ่ายซ้ำจึงต้องอัปเดตรายการเดิม ไม่ใช่สร้างใหม่ ไม่งั้นรายจ่ายจะซ้ำซ้อน
      onSyncPayrollExpense: (input) => {
        let resultOperation: ISyncOperation | null = null

        set((state) => {
          const existingIndex = state.transactions.findIndex(
            (transaction) =>
              transaction.source === 'payroll' && transaction.sourceRefId === input.payrollEntryId,
          )

          // ยอดสุทธิไม่เป็นบวกก็ไม่ต้องมีรายจ่าย ให้ลบรายการที่ผูกไว้ทิ้ง
          if (input.amount <= 0) {
            const existingTransaction = state.transactions[existingIndex]
            if (existingTransaction) {
              resultOperation = { kind: 'transaction', action: 'delete', id: existingTransaction.id }
            }

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
            const newTransaction: ITransaction = {
              id: createId(),
              type: 'expense',
              amount: input.amount,
              categoryId: PAYROLL_CATEGORY_ID,
              note: input.note,
              date: input.date,
              createdAt: new Date().toISOString(),
              source: 'payroll',
              sourceRefId: input.payrollEntryId,
            }
            resultOperation = {
              kind: 'transaction',
              action: 'upsert',
              id: newTransaction.id,
              payload: newTransaction,
            }

            return { transactions: [...state.transactions, newTransaction] }
          }

          const nextTransactions = [...state.transactions]
          const updatedTransaction: ITransaction = {
            ...nextTransactions[existingIndex],
            amount: input.amount,
            note: input.note,
            date: input.date,
          }
          nextTransactions[existingIndex] = updatedTransaction
          resultOperation = {
            kind: 'transaction',
            action: 'upsert',
            id: updatedTransaction.id,
            payload: updatedTransaction,
          }

          return { transactions: nextTransactions }
        })

        if (resultOperation) enqueueSyncOperation(resultOperation)
      },

      onRemovePayrollExpense: (payrollEntryId) => {
        let removedTransactionId: string | null = null

        set((state) => {
          const existingTransaction = state.transactions.find(
            (transaction) => transaction.source === 'payroll' && transaction.sourceRefId === payrollEntryId,
          )
          removedTransactionId = existingTransaction?.id ?? null

          return {
            transactions: state.transactions.filter(
              (transaction) =>
                !(transaction.source === 'payroll' && transaction.sourceRefId === payrollEntryId),
            ),
          }
        })

        if (removedTransactionId) {
          enqueueSyncOperation({ kind: 'transaction', action: 'delete', id: removedTransactionId })
        }
      },

      onReplaceAll: (transactions) => set({ transactions }),
    }),
    {
      name: 'budget-calc:transactions',
      // แยกพื้นที่เก็บข้อมูลตามบัญชีผู้ใช้ (key จริงคือ '<name>:<userId>')
      storage: userScopedStorage,
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
