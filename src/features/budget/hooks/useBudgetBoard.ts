'use client'

import { useMemo, useState } from 'react'
import { useBudgetStore } from '@/features/budget/store/useBudgetStore'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import { calcBudgetTotals, calcBudgetUsage } from '@/features/budget/utils/budgetCalc'
import { toYearMonthString } from '@/utils/date'
import { getPeriodLabel } from '@/utils/period'
import { toYearMonth } from '@/utils/format'

// คืนเดือนปัจจุบันตามเวลาท้องถิ่นรูปแบบ 'yyyy-MM'
function getCurrentYearMonth(): string {
  return toYearMonthString(new Date())
}

// เลื่อนเดือนไปข้างหน้า/ถอยหลังตามจำนวนที่กำหนด คำนวณผ่าน Date object กันปัญหาเดือน 13/0 เอง
function shiftYearMonth(yearMonth: string, offset: number): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const shiftedDate = new Date(year, month - 1 + offset, 1)
  return toYearMonthString(shiftedDate)
}

// รวม state และ logic ของกระดานงบประมาณ: เดือนที่กำลังดู, ยอดใช้จ่ายต่อหมวด, ยอดรวม และหมวดที่ยังไม่ได้ตั้งงบ
export function useBudgetBoard() {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth)

  const budgets = useBudgetStore((state) => state.budgets)
  const transactions = useTransactionStore((state) => state.transactions)
  const categories = useTransactionStore((state) => state.categories)

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.type === 'expense'),
    [categories],
  )

  const usages = useMemo(() => calcBudgetUsage(budgets, transactions, yearMonth), [budgets, transactions, yearMonth])

  const totals = useMemo(() => calcBudgetTotals(usages), [usages])

  const monthLabel = useMemo(() => getPeriodLabel(yearMonth, 'month'), [yearMonth])

  // หมวดที่มีการใช้จ่ายในเดือนนี้แล้วแต่ยังไม่ได้ตั้งงบไว้ เอาไว้ชวนผู้ใช้ตั้งงบเพิ่ม
  // จำกัดเฉพาะหมวดที่มีการใช้จ่ายจริง จะได้ไม่รกด้วยหมวดที่ไม่เคยใช้เลย
  const unbudgetedCategories = useMemo(() => {
    const budgetedCategoryIds = new Set(budgets.map((budget) => budget.categoryId))
    const spentCategoryIds = new Set(
      transactions
        .filter((transaction) => transaction.type === 'expense' && toYearMonth(transaction.date) === yearMonth)
        .map((transaction) => transaction.categoryId),
    )

    return expenseCategories.filter(
      (category) => spentCategoryIds.has(category.id) && !budgetedCategoryIds.has(category.id),
    )
  }, [budgets, transactions, expenseCategories, yearMonth])

  const onPrevMonth = () => setYearMonth((current) => shiftYearMonth(current, -1))
  const onNextMonth = () => setYearMonth((current) => shiftYearMonth(current, 1))
  const onCurrentMonth = () => setYearMonth(getCurrentYearMonth())

  return {
    yearMonth,
    monthLabel,
    usages,
    totals,
    expenseCategories,
    budgets,
    unbudgetedCategories,
    onPrevMonth,
    onNextMonth,
    onCurrentMonth,
  }
}
