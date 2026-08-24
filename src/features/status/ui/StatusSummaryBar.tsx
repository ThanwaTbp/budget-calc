import { CircleCheck, CircleX, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCheckedAt } from '@/features/status/utils/formatCheckedAt'
import type { IStatusReport } from '@/types/status'

interface IStatusSummaryBar {
  report: IStatusReport
}

interface ISummaryTone {
  icon: LucideIcon
  containerClassName: string
  message: string
}

// สรุปภาพรวมจากสถานะของทุกบริการ: มีตัวใช้งานไม่ได้ > มีตัวตอบช้า > ปกติทั้งหมด
// สถานะ 'unknown' ไม่นับเป็นความผิดปกติ เพราะแปลว่าตรวจไม่ได้ (ยังไม่ตั้งค่า) ไม่ใช่บริการพัง
function buildSummaryTone(report: IStatusReport): ISummaryTone {
  const downCount = report.services.filter((service) => service.status === 'down').length
  const degradedCount = report.services.filter((service) => service.status === 'degraded').length

  if (downCount > 0) {
    return {
      icon: CircleX,
      containerClassName: 'border-expense/40 bg-expense-muted text-expense',
      message: `พบบริการใช้งานไม่ได้ ${downCount} รายการ`,
    }
  }

  if (degradedCount > 0) {
    return {
      icon: TriangleAlert,
      containerClassName: 'border-warning/40 bg-warning-muted text-warning',
      message: `พบบริการตอบสนองช้า ${degradedCount} รายการ`,
    }
  }

  return {
    icon: CircleCheck,
    containerClassName: 'border-income/40 bg-income-muted text-income',
    message: 'ระบบทำงานปกติทั้งหมด',
  }
}

export function StatusSummaryBar({ report }: IStatusSummaryBar) {
  const summaryTone = buildSummaryTone(report)
  const SummaryIcon = summaryTone.icon

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        summaryTone.containerClassName,
      )}
    >
      <div className="flex items-center gap-3">
        <SummaryIcon className="size-5" />
        <p className="text-sm font-semibold">{summaryTone.message}</p>
      </div>
      <p className="text-xs opacity-80">ตรวจล่าสุด {formatCheckedAt(report.checkedAt)}</p>
    </div>
  )
}
