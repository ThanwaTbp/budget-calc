import type { BudgetStatus, IBudget } from '@/types/budget'
import type { ITransaction } from '@/types/finance'
import { toYearMonth } from '@/utils/format'

export interface IBudgetUsage {
  categoryId: string
  limit: number
  spent: number
  remaining: number
  usedPercent: number
  status: BudgetStatus
}

export interface IBudgetTotals {
  totalLimit: number
  totalSpent: number
  totalRemaining: number
  usedPercent: number
  status: BudgetStatus
}

// เกณฑ์สถานะการใช้งบ: ใช้ไป < 80% ปลอดภัย · 80-100% ใกล้เต็ม · เกิน 100% เกินงบ
export function getBudgetStatus(usedPercent: number): BudgetStatus {
  if (usedPercent > 100) return 'over'
  if (usedPercent >= 80) return 'warning'
  return 'safe'
}

// รวมยอดใช้จ่ายจริงต่อหมวดของเดือนที่เลือก แล้วเทียบกับวงเงินที่ตั้งไว้
// นับเฉพาะ transaction ประเภทรายจ่ายที่อยู่ในเดือนนั้นเท่านั้น
export function calcBudgetUsage(
  budgets: IBudget[],
  transactions: ITransaction[],
  yearMonth: string,
): IBudgetUsage[] {
  const usages = budgets.map((budget) => {
    const spent = transactions
      .filter(
        (transaction) =>
          transaction.type === 'expense' &&
          transaction.categoryId === budget.categoryId &&
          toYearMonth(transaction.date) === yearMonth,
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    // งบเป็น 0 ห้ามหารด้วยศูนย์ ให้ถือว่าใช้ไป 0%
    const usedPercent = budget.amount === 0 ? 0 : Math.round((spent / budget.amount) * 100)

    return {
      categoryId: budget.categoryId,
      limit: budget.amount,
      spent,
      remaining: budget.amount - spent,
      usedPercent,
      status: getBudgetStatus(usedPercent),
    }
  })

  // เรียงหมวดที่เสี่ยงเกินงบ (ใช้ไปมากที่สุด) ขึ้นก่อน
  return usages.sort((usageA, usageB) => usageB.usedPercent - usageA.usedPercent)
}

// รวมยอดทั้งหมดของทุกหมวดเป็นภาพรวมของเดือนนั้น
export function calcBudgetTotals(usages: IBudgetUsage[]): IBudgetTotals {
  const totalLimit = usages.reduce((sum, usage) => sum + usage.limit, 0)
  const totalSpent = usages.reduce((sum, usage) => sum + usage.spent, 0)
  const totalRemaining = totalLimit - totalSpent
  const usedPercent = totalLimit === 0 ? 0 : Math.round((totalSpent / totalLimit) * 100)

  return {
    totalLimit,
    totalSpent,
    totalRemaining,
    usedPercent,
    status: getBudgetStatus(usedPercent),
  }
}
