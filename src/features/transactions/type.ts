import type { TransactionType } from '@/types/finance'

export interface ITransactionInput {
  type: TransactionType
  amount: number
  categoryId: string
  note: string
  date: string
}

// ข้อมูลที่รอบจ่ายค่าจ้างส่งมาให้สร้าง/อัปเดตรายจ่ายอัตโนมัติ
export interface IPayrollExpenseInput {
  payrollEntryId: string
  amount: number
  date: string
  note: string
}

export interface ITransactionFilter {
  type: TransactionType | 'all'
  categoryId: string
  keyword: string
}

export interface ITransactionFilterSummary {
  totalIncome: number
  totalExpense: number
  balance: number
}

// ตัวเลือกปีของแถบเลือกช่วงเวลา บังคับเลือกเสมอ ไม่มี 'ทุกปี'
export interface ITransactionYearOption {
  value: string
  label: string
}

// ตัวเลือกเดือนของแถบเลือกช่วงเวลา ครบ 12 เดือนเสมอ + 'ทั้งปี' พร้อมสถานะว่ามีข้อมูลหรือไม่
export interface ITransactionMonthOption {
  value: string
  label: string
  hasData: boolean
}
