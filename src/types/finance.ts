export type TransactionType = 'income' | 'expense'

// รายการที่ถูกสร้างอัตโนมัติจากรอบจ่ายค่าจ้าง จะแก้/ลบตรงๆ ในหน้ารายรับ-รายจ่ายไม่ได้
export type TransactionSource = 'manual' | 'payroll'

export interface ICategory {
  id: string
  name: string
  type: TransactionType
  icon: string
  chartToken: string
}

export interface ITransaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  note: string
  date: string
  createdAt: string
  source: TransactionSource
  sourceRefId: string | null
}

export interface IEmployee {
  id: string
  name: string
  note: string
  createdAt: string
}

// รายการเงินหนึ่งบรรทัดในรอบจ่าย: earning = ได้เพิ่ม, deduction = ถูกหัก
export type PayItemKind = 'earning' | 'deduction'

export interface IPayItem {
  id: string
  label: string
  amount: number
  kind: PayItemKind
}

// รอบจ่ายค่าจ้างของพนักงานหนึ่งคน หนึ่งรอบมีได้หลายรายการเงิน
export interface IPayrollEntry {
  id: string
  employeeId: string
  date: string
  items: IPayItem[]
  note: string
  createdAt: string
}

export interface IPayrollResult {
  entryId: string
  employeeId: string
  totalEarning: number
  totalDeduction: number
  netPay: number
}
