import type { BudgetStatus } from '@/types/budget'

// สีข้อความตามสถานะการใช้งบ ใช้ร่วมกันทั้งแถบสรุปและการ์ดรายหมวด
export const budgetStatusTextClass: Record<BudgetStatus, string> = {
  safe: 'text-income',
  warning: 'text-warning',
  over: 'text-expense',
}

// สีแถบ Progress ตามสถานะ ใช้ arbitrary selector เจาะ data-slot ของ indicator
// เพราะ Progress กลาง (components/ui) fix สีเป็น bg-primary ไว้ แก้ไม่ได้ตรงๆ
export const budgetStatusIndicatorClass: Record<BudgetStatus, string> = {
  safe: '[&>[data-slot=progress-indicator]]:bg-income',
  warning: '[&>[data-slot=progress-indicator]]:bg-warning',
  over: '[&>[data-slot=progress-indicator]]:bg-expense',
}
