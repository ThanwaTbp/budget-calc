import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { IEmployee, IPayrollEntry } from '@/types/finance'
import { createId } from '@/utils/id'
import { calcPayrollEntry } from '@/utils/calc'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import type { IEmployeeInput, IPayrollEntryInput } from '@/features/payroll/type'

interface IPayrollStore {
  employees: IEmployee[]
  entries: IPayrollEntry[]
  onCreateEmployee: (input: IEmployeeInput) => void
  onUpdateEmployee: (id: string, input: IEmployeeInput) => void
  onDeleteEmployee: (id: string) => void
  onCreateEntry: (input: IPayrollEntryInput) => void
  onUpdateEntry: (id: string, input: IPayrollEntryInput) => void
  onDeleteEntry: (id: string) => void
  onReset: () => void
}

// ประกอบข้อความหมายเหตุของรายจ่ายอัตโนมัติ: 'ค่าจ้าง: <ชื่อ>' ต่อท้ายด้วยหมายเหตุของรอบจ่าย (ถ้ามี)
function buildPayrollExpenseNote(employeeName: string, entryNote: string): string {
  const trimmedNote = entryNote.trim()
  return trimmedNote ? `ค่าจ้าง: ${employeeName} — ${trimmedNote}` : `ค่าจ้าง: ${employeeName}`
}

// สร้าง/อัปเดตรายจ่ายอัตโนมัติที่ผูกกับรอบจ่ายหนึ่งรอบ ให้ยอดตรงกับเงินสุทธิล่าสุดเสมอ (ผูกกัน 1:1 ผ่าน sourceRefId)
function syncPayrollExpense(entry: IPayrollEntry, employeeName: string): void {
  const { netPay } = calcPayrollEntry(entry)
  useTransactionStore.getState().onSyncPayrollExpense({
    payrollEntryId: entry.id,
    amount: netPay,
    date: entry.date,
    note: buildPayrollExpenseNote(employeeName, entry.note),
  })
}

export const usePayrollStore = create<IPayrollStore>()(
  persist(
    (set, get) => ({
      employees: [],
      entries: [],

      onCreateEmployee: (input) =>
        set((state) => ({
          employees: [
            ...state.employees,
            { ...input, id: createId(), createdAt: new Date().toISOString() },
          ],
        })),

      // เปลี่ยนชื่อพนักงานแล้วต้อง sync หมายเหตุของรายจ่ายอัตโนมัติทุกรอบจ่ายของคนนั้นตามไปด้วย
      // ไม่งั้นรายจ่ายจะค้างชื่อเดิมจนตามรอยที่มาไม่ได้
      onUpdateEmployee: (id, input) => {
        const previousEmployee = get().employees.find((employee) => employee.id === id)

        set((state) => ({
          employees: state.employees.map((employee) =>
            employee.id === id ? { ...employee, ...input } : employee,
          ),
        }))

        if (previousEmployee && previousEmployee.name !== input.name) {
          get()
            .entries.filter((entry) => entry.employeeId === id)
            .forEach((entry) => syncPayrollExpense(entry, input.name))
        }
      },

      // ลบพนักงานต้องลบรอบจ่ายของคนนั้นทั้งหมด พร้อมรายจ่ายอัตโนมัติที่ผูกไว้ ไม่งั้นข้อมูลจะค้างเป็นเศษ
      onDeleteEmployee: (id) => {
        const entriesToRemove = get().entries.filter((entry) => entry.employeeId === id)
        entriesToRemove.forEach((entry) => {
          useTransactionStore.getState().onRemovePayrollExpense(entry.id)
        })

        set((state) => ({
          employees: state.employees.filter((employee) => employee.id !== id),
          entries: state.entries.filter((entry) => entry.employeeId !== id),
        }))
      },

      onCreateEntry: (input) => {
        const employee = get().employees.find((employeeItem) => employeeItem.id === input.employeeId)
        const entry: IPayrollEntry = {
          id: createId(),
          employeeId: input.employeeId,
          date: input.date,
          note: input.note,
          items: input.items.map((item) => ({ ...item, id: createId() })),
          createdAt: new Date().toISOString(),
        }

        set((state) => ({ entries: [...state.entries, entry] }))
        syncPayrollExpense(entry, employee?.name ?? 'ไม่ระบุชื่อ')
      },

      // แก้รอบจ่าย = อัปเดตรายจ่ายเดิมที่ผูกไว้ ไม่สร้างใหม่ (ผ่าน onSyncPayrollExpense ที่ค้นด้วย sourceRefId เดิม)
      onUpdateEntry: (id, input) => {
        const employee = get().employees.find((employeeItem) => employeeItem.id === input.employeeId)
        const previousEntry = get().entries.find((entryItem) => entryItem.id === id)
        const updatedEntry: IPayrollEntry = {
          id,
          employeeId: input.employeeId,
          date: input.date,
          note: input.note,
          items: input.items.map((item) => ({ ...item, id: createId() })),
          createdAt: previousEntry?.createdAt ?? new Date().toISOString(),
        }

        set((state) => ({
          entries: state.entries.map((entryItem) => (entryItem.id === id ? updatedEntry : entryItem)),
        }))
        syncPayrollExpense(updatedEntry, employee?.name ?? 'ไม่ระบุชื่อ')
      },

      onDeleteEntry: (id) => {
        set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) }))
        useTransactionStore.getState().onRemovePayrollExpense(id)
      },

      onReset: () => set({ employees: [], entries: [] }),
    }),
    {
      name: 'budget-calc:payroll',
      version: 3,
      // โครงสร้างข้อมูลเปลี่ยนใหม่ทั้งหมดจากเวอร์ชันเดิม (rateType/OT/workUnits และสถานะการทำงานของพนักงานเดิมไม่ใช้แล้ว)
      // จึงทิ้งข้อมูลเก่าทั้งหมดแทนการแปลงทีละ field
      migrate: () => ({ employees: [], entries: [] }),
    },
  ),
)
