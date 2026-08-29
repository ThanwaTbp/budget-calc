import Link from 'next/link'
import { CheckCircle2, CircleDashed, CloudSun, ListTodo } from 'lucide-react'
import { PlannerViewToggle } from '@/features/planner/ui/PlannerViewToggle'
import type { IMonthTaskSummary, PlannerViewMode } from '@/features/planner/type'
import { formatNumber } from '@/utils/format'

interface IPlannerControlBar {
  viewMode: PlannerViewMode
  onViewModeChange: (mode: PlannerViewMode) => void
  monthSummary: IMonthTaskSummary
  monthLabel: string
  hasForecast: boolean
  locationName: string
}

const viewDescriptionMap: Record<PlannerViewMode, string> = {
  calendar: 'ดูงานทั้งเดือนและกด event เพื่อแก้ไขได้ทันที',
  day: 'โฟกัสรายการและสภาพอากาศของวันที่เลือก',
  month: 'อ่านงานทั้งเดือนแบบลิสต์ตามลำดับวัน',
}

interface ISummaryItem {
  label: string
  value: number
  icon: typeof ListTodo
  valueClassName: string
}

export function PlannerControlBar({
  viewMode,
  onViewModeChange,
  monthSummary,
  monthLabel,
  hasForecast,
  locationName,
}: IPlannerControlBar) {
  const summaryItems: ISummaryItem[] = [
    { label: 'ทั้งหมด', value: monthSummary.total, icon: ListTodo, valueClassName: 'text-foreground' },
    { label: 'ค้างอยู่', value: monthSummary.todo, icon: CircleDashed, valueClassName: 'text-warning' },
    { label: 'เสร็จแล้ว', value: monthSummary.done, icon: CheckCircle2, valueClassName: 'text-income' },
  ]

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-label="ตัวควบคุมหน้าวางแผนงาน">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold tracking-tight">เลือกวิธีดูงาน</p>
          <p className="text-sm text-muted-foreground">{viewDescriptionMap[viewMode]}</p>
        </div>
        <PlannerViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      <div className="grid grid-cols-3 border-t border-border bg-muted/25">
        {summaryItems.map((summaryItem, itemIndex) => (
          <div
            key={summaryItem.label}
            className={`flex min-w-0 items-center gap-2 px-3 py-3 sm:px-5 ${itemIndex > 0 ? 'border-l border-border' : ''}`}
          >
            <summaryItem.icon className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{summaryItem.label}</p>
              <p className={`tabular text-lg font-semibold ${summaryItem.valueClassName}`}>
                {formatNumber(summaryItem.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
        <span>สรุปของ {monthLabel}</span>
        {hasForecast && (
          <Link href="/weather" className="ml-auto flex items-center gap-1.5 font-medium hover:text-foreground">
            <CloudSun className="size-3.5" />
            {locationName}
            <span className="underline underline-offset-2">เปลี่ยนสถานที่</span>
          </Link>
        )}
      </div>
    </section>
  )
}
