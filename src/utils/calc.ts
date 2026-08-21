import type {
  IFinanceSummary,
  IPayrollEntry,
  IPayrollResult,
  ITransaction,
  TransactionType,
} from '@/types/finance'
import { toYearMonth } from '@/utils/format'

// รวมยอดของรอบจ่ายหนึ่งรอบ: ได้เพิ่มทั้งหมด ลบด้วยที่ถูกหักทั้งหมด
export function calcPayrollEntry(entry: IPayrollEntry): IPayrollResult {
  const totalEarning = entry.items
    .filter((item) => item.kind === 'earning')
    .reduce((total, item) => total + item.amount, 0)

  const totalDeduction = entry.items
    .filter((item) => item.kind === 'deduction')
    .reduce((total, item) => total + item.amount, 0)

  return {
    entryId: entry.id,
    employeeId: entry.employeeId,
    totalEarning,
    totalDeduction,
    netPay: totalEarning - totalDeduction,
  }
}

// ต้นทุนค่าจ้างรวมของทุกรอบจ่ายที่ระบุ
export function calcTotalPayrollCost(entries: IPayrollEntry[]): number {
  return entries.reduce((total, entry) => total + calcPayrollEntry(entry).netPay, 0)
}

// สรุปภาพรวมการเงิน — totalExpense รวมค่าจ้างที่ถูกบันทึกเป็นรายจ่ายอัตโนมัติไว้แล้ว
// payrollCost จึงเป็นตัวเลขแยกไว้ดูเฉยๆ ไม่ต้องบวกเพิ่มอีก มิฉะนั้นจะนับซ้ำ
export function calcFinanceSummary(
  transactions: ITransaction[],
  payrollEntries: IPayrollEntry[],
): IFinanceSummary {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)

  const totalExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amount, 0)

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    payrollCost: calcTotalPayrollCost(payrollEntries),
  }
}

// จัดกลุ่มรายการตามเดือน (yyyy-MM) แล้วเรียงจากเดือนเก่าไปใหม่ ใช้วาดกราฟแนวโน้ม
export function groupByMonth(
  transactions: ITransaction[],
): Array<{ yearMonth: string; income: number; expense: number }> {
  const summaryByMonth = new Map<string, { income: number; expense: number }>()

  transactions.forEach((transaction) => {
    const yearMonth = toYearMonth(transaction.date)
    const currentSummary = summaryByMonth.get(yearMonth) ?? { income: 0, expense: 0 }

    if (transaction.type === 'income') {
      currentSummary.income += transaction.amount
    } else {
      currentSummary.expense += transaction.amount
    }

    summaryByMonth.set(yearMonth, currentSummary)
  })

  return Array.from(summaryByMonth.entries())
    .map(([yearMonth, summary]) => ({ yearMonth, ...summary }))
    .sort((monthA, monthB) => monthA.yearMonth.localeCompare(monthB.yearMonth))
}

// จัดกลุ่มยอดตามหมวดหมู่ (เฉพาะ type ที่ระบุ) เรียงจากยอดมากไปน้อย ใช้วาดกราฟสัดส่วน
export function groupByCategory(
  transactions: ITransaction[],
  type: TransactionType,
): Array<{ categoryId: string; total: number }> {
  const totalByCategory = new Map<string, number>()

  transactions
    .filter((transaction) => transaction.type === type)
    .forEach((transaction) => {
      const currentTotal = totalByCategory.get(transaction.categoryId) ?? 0
      totalByCategory.set(transaction.categoryId, currentTotal + transaction.amount)
    })

  return Array.from(totalByCategory.entries())
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((categoryA, categoryB) => categoryB.total - categoryA.total)
}
