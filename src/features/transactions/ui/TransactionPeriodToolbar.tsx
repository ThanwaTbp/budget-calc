'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ALL_MONTHS_VALUE } from '@/features/transactions/hooks/useTransactionList'
import type { ITransactionMonthOption, ITransactionYearOption } from '@/features/transactions/type'
import { cn } from '@/lib/utils'

// ป้ายสถานะข้อมูลชิดขวาของตัวเลือกเดือน ไม่แสดงกับตัวเลือก 'ทั้งปี'
function PeriodDataStatusBadge({ hasData }: { hasData: boolean }) {
  return (
    <span className={cn('flex items-center gap-1.5 text-xs', hasData ? 'text-income' : 'text-expense')}>
      <span className={cn('size-1.5 rounded-full', hasData ? 'bg-income' : 'bg-expense')} />
      {hasData ? 'มีข้อมูล' : 'ไม่มีข้อมูล'}
    </span>
  )
}

interface ITransactionPeriodToolbar {
  yearOptions: ITransactionYearOption[]
  yearValue: string
  onYearChange: (value: string) => void
  monthOptions: ITransactionMonthOption[]
  monthValue: string
  onMonthChange: (value: string) => void
}

// ตัวเลือกช่วงเวลาของหน้ารายรับ-รายจ่าย: บังคับเลือกปีเสมอ (ไม่มี 'ทุกปี') แล้วค่อยเลือกเดือนย่อยได้
export function TransactionPeriodToolbar({
  yearOptions,
  yearValue,
  onYearChange,
  monthOptions,
  monthValue,
  onMonthChange,
}: ITransactionPeriodToolbar) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={yearValue} onValueChange={onYearChange}>
        <SelectTrigger className="w-full sm:w-44">
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

      <Select value={monthValue} onValueChange={onMonthChange}>
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {monthOptions
              .filter((option) => option.value === ALL_MONTHS_VALUE)
              .map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            {monthOptions
              .filter((option) => option.value !== ALL_MONTHS_VALUE)
              .map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="flex w-full items-center justify-between gap-3 [&>span:last-child]:w-full"
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>{option.label}</span>
                    <PeriodDataStatusBadge hasData={option.hasData} />
                  </span>
                </SelectItem>
              ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
