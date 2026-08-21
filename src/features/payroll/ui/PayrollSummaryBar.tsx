import type { IPayrollPeriodSummary } from '@/features/payroll/type'
import { formatCurrency, formatNumber } from '@/utils/format'

interface IPayrollSummaryBar {
  periodSummary: IPayrollPeriodSummary
  periodLabel: string
  // 'overview' แสดงจำนวนพนักงานที่มีรอบจ่ายด้วย ส่วน 'personal' ซ่อนไว้เพราะดูแค่คนเดียวอยู่แล้ว
  variant?: 'overview' | 'personal'
}

// แถบสรุปยอดของงวดที่เลือกอยู่ ใช้ซ้ำได้ทั้งแท็บภาพรวม (ทุกคน) และแท็บรายคน (พนักงานคนเดียว)
export function PayrollSummaryBar({ periodSummary, periodLabel, variant = 'overview' }: IPayrollSummaryBar) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg border border-border bg-muted/40 px-5 py-4">
      <p className="w-full text-sm text-muted-foreground">สรุปของ {periodLabel}</p>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">ยอดจ่ายงวดนี้</span>
        <span className="tabular text-xl font-semibold text-primary">
          {formatCurrency(periodSummary.totalNetPay)}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">รอบจ่าย</span>
        <span className="tabular text-base font-semibold">{formatNumber(periodSummary.entryCount)}</span>
      </div>

      {variant === 'overview' && (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-muted-foreground">พนักงานที่มีรอบจ่าย</span>
          <span className="tabular text-base font-semibold">{formatNumber(periodSummary.employeeCount)}</span>
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">จ่ายเพิ่ม</span>
        <span className="tabular text-base font-semibold text-income">
          {formatCurrency(periodSummary.totalEarning)}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground">หัก</span>
        <span className="tabular text-base font-semibold text-expense">
          {formatCurrency(periodSummary.totalDeduction)}
        </span>
      </div>
    </div>
  )
}
