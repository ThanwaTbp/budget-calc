'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALL_VALUE } from '@/features/payroll/hooks/usePayrollBoard'
import type { IDayOption, IMonthOption, IYearOption } from '@/features/payroll/type'
import { cn } from '@/lib/utils'

// ป้ายสถานะข้อมูลชิดขวาของตัวเลือกเดือน/วัน ไม่แสดงกับตัวเลือก 'ทั้งปี'/'ทั้งเดือน' (value = ALL_VALUE)
function PeriodDataStatusBadge({ hasData }: { hasData: boolean }) {
  return (
    <span className={cn('flex items-center gap-1.5 text-xs', hasData ? 'text-income' : 'text-expense')}>
      <span className={cn('size-1.5 rounded-full', hasData ? 'bg-income' : 'bg-expense')} />
      {hasData ? 'มีข้อมูล' : 'ไม่มีข้อมูล'}
    </span>
  )
}

interface IPayrollPeriodToolbar {
  yearOptions: IYearOption[]
  yearValue: string
  onYearChange: (value: string) => void
  monthOptions: IMonthOption[]
  monthValue: string
  onMonthChange: (value: string) => void
  monthDisabled: boolean
  dayOptions: IDayOption[]
  dayValue: string
  onDayChange: (value: string) => void
  dayDisabled: boolean
}

// ตัวกรองช่วงเวลาของหน้าค่าจ้าง แยกเป็น 3 Select อิสระ (ปี/เดือน/วัน) ใช้ร่วมกันทั้งแท็บภาพรวมและแท็บรายคน
// granularity ที่ใช้กรองข้อมูลจริงถูกอนุมานจากค่าทั้งสามนี้ใน usePayrollBoard ไม่ต้องให้ผู้ใช้เลือกเอง
export function PayrollPeriodToolbar({
  yearOptions,
  yearValue,
  onYearChange,
  monthOptions,
  monthValue,
  onMonthChange,
  monthDisabled,
  dayOptions,
  dayValue,
  onDayChange,
  dayDisabled,
}: IPayrollPeriodToolbar) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={yearValue} onValueChange={onYearChange}>
        <SelectTrigger className="w-full sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={monthValue} onValueChange={onMonthChange} disabled={monthDisabled}>
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="flex w-full items-center justify-between gap-3 [&>span:last-child]:w-full"
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span>{option.label}</span>
                {option.value !== ALL_VALUE && <PeriodDataStatusBadge hasData={option.hasData} />}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={dayValue} onValueChange={onDayChange} disabled={dayDisabled}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dayOptions.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="flex w-full items-center justify-between gap-3 [&>span:last-child]:w-full"
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span>{option.label}</span>
                {option.value !== ALL_VALUE && <PeriodDataStatusBadge hasData={option.hasData} />}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
