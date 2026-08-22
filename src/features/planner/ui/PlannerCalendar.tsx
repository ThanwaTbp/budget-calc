'use client'

import { useEffect, useRef, type ComponentProps } from 'react'
import { type DayButton } from 'react-day-picker'
import { th } from 'react-day-picker/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { getDayIndicatorTone, getLocalDateString, parseLocalDateString } from '@/features/planner/hooks/usePlannerBoard'
import type { DayIndicatorTone, IDayTaskSummary } from '@/features/planner/type'

interface IPlannerCalendar {
  selectedDate: string
  onSelectDate: (date: string) => void
  visibleMonth: Date
  onVisibleMonthChange: (month: Date) => void
  dayIndicators: Map<string, IDayTaskSummary>
}

// สีจุดบ่งชี้ใต้ตัวเลขวัน: pending = ยังมีงานค้าง (สีหลัก), done = เสร็จหมดทุกงานแล้ว (สีรายรับ)
const indicatorDotClassMap: Record<DayIndicatorTone, string> = {
  pending: 'bg-primary',
  done: 'bg-income',
}

// จำนวนจุดสูงสุดที่วาด งานเยอะกว่านี้ก็ยังแสดงแค่ 3 จุด ไม่ให้ช่องวันรก
const MAX_INDICATOR_DOTS = 3

// ใช้ locale ไทยแสดงหัวเดือนเป็นปี พ.ศ. (Intl th-TH คืนปีพุทธศักราชให้อัตโนมัติ)
const captionFormatter = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' })

interface IPlannerDayButton extends ComponentProps<typeof DayButton> {
  dayIndicators: Map<string, IDayTaskSummary>
}

// override ปุ่มวันที่ของปฏิทิน: วันที่มีงานจะตัวเลขหนาขึ้นและมีจุดใต้ตัวเลข (สูงสุด 3 จุดตามจำนวนงาน)
// เลี่ยงการใส่พื้นหลัง/ตัวเลขมุมช่องเพิ่ม เพราะทำให้ตารางรกและแข่งกับวันที่ถูกเลือกซึ่งต้องเด่นที่สุด
function PlannerDayButton({ className, day, modifiers, dayIndicators, children, ...buttonProps }: IPlannerDayButton) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (modifiers.focused) buttonRef.current?.focus()
  }, [modifiers.focused])

  const dateKey = getLocalDateString(day.date)
  const summary = dayIndicators.get(dateKey)
  const hasTask = summary !== undefined && summary.total > 0
  const tone: DayIndicatorTone | null = hasTask && summary ? getDayIndicatorTone(summary) : null
  const isSelected = Boolean(modifiers.selected)

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      data-selected-single={isSelected}
      className={cn(
        // ตัวเลขวันอยู่กึ่งกลางช่องเสมอ ส่วนจุดบ่งชี้ลอยอยู่ล่างแบบ absolute จึงไม่ดันตัวเลขให้เบี้ยว
        'relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) items-center justify-center rounded-lg border-0 text-sm leading-none font-normal transition-colors hover:bg-muted',
        'group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-ring/50',
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:font-semibold data-[selected-single=true]:text-primary-foreground data-[selected-single=true]:shadow-sm dark:hover:text-foreground',
        modifiers.today && !isSelected && 'font-semibold text-primary ring-1 ring-primary/50',
        modifiers.outside && !isSelected && 'text-muted-foreground/50',
        hasTask && !isSelected && !modifiers.outside && 'font-semibold',
        className,
      )}
      {...buttonProps}
    >
      {children}

      {hasTask && summary && !modifiers.outside && (
        <span className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-[3px]">
          {Array.from({ length: Math.min(summary.total, MAX_INDICATOR_DOTS) }).map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={cn(
                'size-1 rounded-full',
                isSelected ? 'bg-primary-foreground' : indicatorDotClassMap[tone as DayIndicatorTone],
              )}
            />
          ))}
        </span>
      )}
    </Button>
  )
}

// ปฏิทินเดือนของหน้าวางแผนงาน วาดตัวบ่งชี้จำนวน/สถานะงานในแต่ละวันจาก dayIndicators พร้อม legend อธิบายสัญลักษณ์
export function PlannerCalendar({
  selectedDate,
  onSelectDate,
  visibleMonth,
  onVisibleMonthChange,
  dayIndicators,
}: IPlannerCalendar) {
  const onSelect = (nextDate: Date | undefined) => {
    if (!nextDate) return
    onSelectDate(getLocalDateString(nextDate))
  }

  return (
    <div className="flex flex-col">
      <Calendar
        mode="single"
        locale={th}
        showOutsideDays
        month={visibleMonth}
        onMonthChange={onVisibleMonthChange}
        selected={parseLocalDateString(selectedDate)}
        onSelect={onSelect}
        formatters={{ formatCaption: (date) => captionFormatter.format(date) }}
        components={{
          DayButton: (props) => <PlannerDayButton {...props} dayIndicators={dayIndicators} />,
        }}
        // ช่องวันเป็นสี่เหลี่ยมมุมมน มีช่องไฟระหว่างช่อง และสูงพอให้จุดบ่งชี้ไม่ชนตัวเลข
        className="w-full p-0 [--cell-radius:var(--radius-lg)] [--cell-size:--spacing(11)]"
        classNames={{
          month: 'flex w-full flex-col gap-2',
          month_caption: 'flex h-9 w-full items-center justify-center',
          caption_label: 'text-base font-semibold tracking-tight select-none',
          nav: 'absolute inset-x-0 top-0 flex h-9 w-full items-center justify-between',
          button_previous:
            'inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          button_next:
            'inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          weekdays: 'flex gap-1',
          weekday: 'flex-1 pb-1 text-xs font-medium text-muted-foreground select-none',
          week: 'mt-1 flex w-full gap-1',
          day: 'group/day relative aspect-square h-full w-full p-0 text-center select-none',
          today: '',
          outside: '',
        }}
      />

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" />
          มีงานค้าง
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-income" />
          เสร็จแล้ว
        </span>
        <span className="ml-auto">จุด = จำนวนงาน</span>
      </div>
    </div>
  )
}
