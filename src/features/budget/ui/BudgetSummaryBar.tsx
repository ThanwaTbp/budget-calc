import type { IBudgetTotals } from '@/features/budget/utils/budgetCalc'
import { budgetStatusTextClass } from '@/features/budget/utils/budgetStatusStyle'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'

interface IBudgetSummaryBar {
  totals: IBudgetTotals
  monthLabel: string
}

// แถบสรุปยอดของเดือนที่กำลังดูอยู่: งบรวม · ใช้ไป · คงเหลือ · ใช้ไปกี่ % (สีตามสถานะรวมของเดือนนั้น)
export function BudgetSummaryBar({ totals, monthLabel }: IBudgetSummaryBar) {
  const statusClass = budgetStatusTextClass[totals.status]
  const isOverBudget = totals.totalRemaining < 0

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg border border-border bg-muted/40 px-5 py-4">
      <p className="w-full text-sm text-muted-foreground">สรุปของ {monthLabel}</p>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">งบรวม</span>
        <span className="tabular text-xl font-semibold">{formatCurrency(totals.totalLimit)}</span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">ใช้ไป</span>
        <span className={cn('tabular text-xl font-semibold', statusClass)}>{formatCurrency(totals.totalSpent)}</span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">คงเหลือ</span>
        <span className={cn('tabular text-xl font-semibold', isOverBudget && 'text-expense')}>
          {isOverBudget
            ? `เกินงบ ${formatCurrency(Math.abs(totals.totalRemaining))}`
            : formatCurrency(totals.totalRemaining)}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">ใช้ไปแล้ว</span>
        <span className={cn('tabular text-xl font-semibold', statusClass)}>{totals.usedPercent}%</span>
      </div>
    </div>
  )
}
