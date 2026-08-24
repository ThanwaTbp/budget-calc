import type { TransactionType } from '@/types/finance'

// บิลที่เกิดซ้ำทุกเดือนวันเดิม เช่น ค่าเช่า เงินเดือน ค่าอินเทอร์เน็ต
export interface IRecurringItem {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  note: string
  dayOfMonth: number
  isActive: boolean
  // 'yyyy-MM' ของเดือนที่ลงรายการไปแล้วล่าสุด ('' = ยังไม่เคยลง) ใช้กันลงซ้ำในเดือนเดียวกัน
  lastPostedYearMonth: string
  createdAt: string
}
