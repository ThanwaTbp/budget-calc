import type { IMonthTaskSummary } from '@/features/planner/type'
import { formatNumber } from '@/utils/format'

interface IPlannerSummaryBar {
  monthSummary: IMonthTaskSummary
  monthLabel: string
}

// แถบสรุปงานของเดือนที่กำลังดูอยู่บนปฏิทิน (โครงเดียวกับ PayrollSummaryBar)
export function PlannerSummaryBar({ monthSummary, monthLabel }: IPlannerSummaryBar) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg border border-border bg-muted/40 px-5 py-4">
      <p className="w-full text-sm text-muted-foreground">สรุปงานของ {monthLabel}</p>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">งานทั้งหมด</span>
        <span className="tabular text-xl font-semibold">{formatNumber(monthSummary.total)}</span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">เสร็จแล้ว</span>
        <span className="tabular text-base font-semibold text-income">{formatNumber(monthSummary.done)}</span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">ค้างอยู่</span>
        <span className="tabular text-base font-semibold text-warning">{formatNumber(monthSummary.todo)}</span>
      </div>
    </div>
  )
}
