'use client'

import { TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react'
import { StatCard } from '@/components/common/StatCard'
import type { IFinanceSummary } from '@/types/finance'
import { formatCurrency, formatNumber } from '@/utils/format'

interface ISummaryCards {
  summary: IFinanceSummary
  expenseRatio: number
  employeeCount: number
  payrollEntryCount: number
}

export function SummaryCards({ summary, expenseRatio, employeeCount, payrollEntryCount }: ISummaryCards) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="รายรับรวม" value={formatCurrency(summary.totalIncome)} icon={TrendingUp} tone="income" />

      <div className="flex flex-col gap-1.5">
        <StatCard
          label="รายจ่ายรวม"
          value={formatCurrency(summary.totalExpense)}
          icon={TrendingDown}
          tone="expense"
          hint={`คิดเป็น ${formatNumber(Math.round(expenseRatio))}% ของรายรับ`}
        />
      </div>

      <StatCard
        label="คงเหลือ"
        value={formatCurrency(summary.balance)}
        icon={Wallet}
        tone={summary.balance >= 0 ? 'income' : 'expense'}
      />

      <StatCard
        label="ต้นทุนพนักงาน"
        value={formatCurrency(summary.payrollCost)}
        icon={Users}
        tone="warning"
        hint={`พนักงาน ${formatNumber(employeeCount)} คน · ${formatNumber(payrollEntryCount)} รอบจ่าย`}
      />
    </div>
  )
}
