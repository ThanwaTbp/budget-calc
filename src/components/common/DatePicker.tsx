'use client'

import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { th } from 'react-day-picker/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface IDatePicker {
  value: string
  onChange: (nextDate: string) => void
  id?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

// แปลง 'yyyy-MM-dd' เป็น Date ตามเวลาท้องถิ่น — new Date(string) จะตีความเป็น UTC ทำให้วันเพี้ยน
function toLocalDate(isoDate: string): Date | undefined {
  if (!isoDate) return undefined
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

// แปลง Date กลับเป็น 'yyyy-MM-dd' ตามเวลาท้องถิ่นด้วยเหตุผลเดียวกัน ห้ามใช้ toISOString()
function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const displayFormatter = new Intl.DateTimeFormat('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = 'เลือกวันที่',
  className,
  disabled,
}: IDatePicker) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedDate = toLocalDate(value)

  const onSelectDate = (nextDate: Date | undefined) => {
    if (!nextDate) return
    onChange(toIsoDate(nextDate))
    setIsOpen(false)
  }

  const onSelectToday = () => {
    onChange(toIsoDate(new Date()))
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-start gap-2.5 px-3 text-base font-normal',
            !selectedDate && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="size-4.5 shrink-0 text-muted-foreground" />
          {selectedDate ? displayFormatter.format(selectedDate) : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={th}
          captionLayout="dropdown"
          startMonth={new Date(new Date().getFullYear() - 10, 0)}
          endMonth={new Date(new Date().getFullYear() + 5, 11)}
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={onSelectDate}
          autoFocus
          // ปฏิทินตัวใหญ่ กดง่าย ช่องละ 40px แทนค่าเริ่มต้น 28px
          className="p-4 [--cell-size:--spacing(10)]"
        />
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {selectedDate ? displayFormatter.format(selectedDate) : 'ยังไม่ได้เลือกวันที่'}
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={onSelectToday}>
            วันนี้
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
