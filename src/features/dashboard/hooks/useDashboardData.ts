'use client'

import { useMemo, useState } from 'react'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import { usePayrollStore } from '@/features/payroll/store/usePayrollStore'
import { calcFinanceSummary, calcPayrollEntry, groupByCategory } from '@/utils/calc'
import { groupByPeriod, type PeriodGranularity } from '@/utils/period'
import type { ICategory, IFinanceSummary, ITransaction } from '@/types/finance'

// จุดข้อมูลหนึ่งช่วงเวลาบนกราฟแนวโน้มรายรับ-รายจ่าย ช่วงเวลาปรับได้ตาม granularity ที่ผู้ใช้เลือก
export interface ITrendPoint {
  label: string
  income: number
  expense: number
  balance: number
}

// สัดส่วนรายจ่ายหนึ่งหมวดหมู่บนกราฟโดนัท (5 อันดับแรก + อื่นๆ)
export interface IExpenseCategorySlice {
  name: string
  total: number
  chartToken: string
}

// สรุปต้นทุนพนักงานหนึ่งคน รวมยอดสุทธิของทุกรอบจ่าย ใช้แสดงอันดับต้นทุนพนักงานสูงสุด
export interface ITopEmployeeRow {
  id: string
  name: string
  note: string
  totalNetPay: number
  entryCount: number
}

export interface IDashboardData {
  summary: IFinanceSummary
  trendPoints: ITrendPoint[]
  granularity: PeriodGranularity
  onGranularityChange: (granularity: PeriodGranularity) => void
  expenseByCategory: IExpenseCategorySlice[]
  recentTransactions: ITransaction[]
  categories: ICategory[]
  topEmployees: ITopEmployeeRow[]
  expenseRatio: number
  employeeCount: number
  payrollEntryCount: number
  hasAnyData: boolean
}

// รวม logic ของหน้าภาพรวม: ดึงข้อมูลจากทั้งสอง store แล้วคำนวณสรุปยอด, แนวโน้ม, สัดส่วน และอันดับต่างๆ
export function useDashboardData(): IDashboardData {
  const transactions = useTransactionStore((state) => state.transactions)
  const categories = useTransactionStore((state) => state.categories)
  const employees = usePayrollStore((state) => state.employees)
  const entries = usePayrollStore((state) => state.entries)

  const [granularity, setGranularity] = useState<PeriodGranularity>('month')

  const summary = useMemo(() => calcFinanceSummary(transactions, entries), [transactions, entries])

  const trendPoints = useMemo<ITrendPoint[]>(() => {
    // groupByPeriod คืนกลุ่มเรียงจากช่วงใหม่ไปเก่า ต้องกลับลำดับก่อนตัดเอา 8 ช่วงล่าสุดแบบเก่า→ใหม่
    const groupedPeriods = [...groupByPeriod(transactions, granularity, (transaction) => transaction.date)].reverse()

    return groupedPeriods.slice(-8).map((period) => {
      const income = period.items
        .filter((transaction) => transaction.type === 'income')
        .reduce((total, transaction) => total + transaction.amount, 0)
      const expense = period.items
        .filter((transaction) => transaction.type === 'expense')
        .reduce((total, transaction) => total + transaction.amount, 0)

      return { label: period.label, income, expense, balance: income - expense }
    })
  }, [transactions, granularity])

  const onGranularityChange = (nextGranularity: PeriodGranularity) => {
    setGranularity(nextGranularity)
  }

  const expenseByCategory = useMemo<IExpenseCategorySlice[]>(() => {
    const groupedExpenses = groupByCategory(transactions, 'expense')
    const topExpenseGroups = groupedExpenses.slice(0, 5)
    const remainingExpenseGroups = groupedExpenses.slice(5)

    // กำหนดสีตามลำดับชิ้นบนกราฟ ไม่ใช้ chartToken ของหมวดหมู่โดยตรง
    // เพราะหมวดรายจ่ายมีมากกว่าจำนวนสีที่มี ทำให้ token ซ้ำกันจนโดนัทมีสีชนกันได้
    const slices = topExpenseGroups.map((expenseGroup, index) => {
      const category = categories.find((item) => item.id === expenseGroup.categoryId)
      return {
        name: category?.name ?? 'ไม่ระบุหมวดหมู่',
        total: expenseGroup.total,
        chartToken: `chart-${index + 1}`,
      }
    })

    // หมวดหมู่ที่เหลือนอกเหนือ 5 อันดับแรกให้รวมเป็น 'อื่นๆ' หนึ่งชิ้น ใช้สีกลางเพื่อไม่ให้แย่งสายตา
    if (remainingExpenseGroups.length > 0) {
      const otherTotal = remainingExpenseGroups.reduce(
        (total, expenseGroup) => total + expenseGroup.total,
        0,
      )
      slices.push({ name: 'อื่นๆ', total: otherTotal, chartToken: 'muted-foreground' })
    }

    return slices
  }, [transactions, categories])

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((transactionA, transactionB) => {
        // เรียงตามวันที่ใหม่→เก่า ถ้าวันที่ตรงกันให้ใช้เวลาที่สร้างล่าสุดก่อน
        const dateComparison = transactionB.date.localeCompare(transactionA.date)
        return dateComparison !== 0
          ? dateComparison
          : transactionB.createdAt.localeCompare(transactionA.createdAt)
      })
      .slice(0, 5)
  }, [transactions])

  const topEmployees = useMemo<ITopEmployeeRow[]>(() => {
    const summaryByEmployeeId = new Map<string, { totalNetPay: number; entryCount: number }>()

    entries.forEach((entry) => {
      const netPay = calcPayrollEntry(entry).netPay
      const currentSummary = summaryByEmployeeId.get(entry.employeeId) ?? { totalNetPay: 0, entryCount: 0 }

      summaryByEmployeeId.set(entry.employeeId, {
        totalNetPay: currentSummary.totalNetPay + netPay,
        entryCount: currentSummary.entryCount + 1,
      })
    })

    return Array.from(summaryByEmployeeId.entries())
      .map(([employeeId, entrySummary]) => {
        const employee = employees.find((item) => item.id === employeeId)
        return {
          id: employeeId,
          name: employee?.name ?? 'ไม่ทราบชื่อ',
          note: employee?.note ?? '',
          totalNetPay: entrySummary.totalNetPay,
          entryCount: entrySummary.entryCount,
        }
      })
      .sort((employeeA, employeeB) => employeeB.totalNetPay - employeeA.totalNetPay)
      .slice(0, 5)
  }, [entries, employees])

  // สัดส่วนรายจ่ายต่อรายรับเป็นเปอร์เซ็นต์ กันหารด้วยศูนย์เมื่อยังไม่มีรายรับ
  const expenseRatio = useMemo(() => {
    return summary.totalIncome === 0 ? 0 : (summary.totalExpense / summary.totalIncome) * 100
  }, [summary])

  const employeeCount = employees.length

  const payrollEntryCount = entries.length

  const hasAnyData = transactions.length > 0 || employees.length > 0 || entries.length > 0

  return {
    summary,
    trendPoints,
    granularity,
    onGranularityChange,
    expenseByCategory,
    recentTransactions,
    categories,
    topEmployees,
    expenseRatio,
    employeeCount,
    payrollEntryCount,
    hasAnyData,
  }
}
