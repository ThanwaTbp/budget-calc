'use client'

import { Check, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { sortDayTasks } from '@/features/planner/hooks/usePlannerBoard'
import type { ITask } from '@/types/planner'
import { getTodayDateString, toLocalDateString } from '@/utils/date'

const weekdayLabels = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
const monthLabelFormatter = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' })
const dayAriaLabelFormatter = new Intl.DateTimeFormat('th-TH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const CALENDAR_DAY_COUNT = 42
const MAX_VISIBLE_EVENTS = 3

interface IPlannerMonthBoard {
  selectedDate: string
  onSelectDate: (date: string) => void
  visibleMonth: Date
  onVisibleMonthChange: (month: Date) => void
  tasksByDate: Map<string, ITask[]>
  onEditTask: (task: ITask) => void
}

interface ICalendarDay {
  date: Date
  dateKey: string
  isCurrentMonth: boolean
}

function buildCalendarDays(visibleMonth: Date): ICalendarDay[] {
  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const gridStartDate = new Date(year, month, 1 - firstDayOfMonth.getDay())

  return Array.from({ length: CALENDAR_DAY_COUNT }, (_, dayIndex) => {
    const date = new Date(gridStartDate.getFullYear(), gridStartDate.getMonth(), gridStartDate.getDate() + dayIndex)
    return {
      date,
      dateKey: toLocalDateString(date),
      isCurrentMonth: date.getMonth() === month,
    }
  })
}

// event ในช่องวันแสดงสถานะด้วยไอคอนและการขีดฆ่าร่วมกับสี เพื่อให้ผู้ใช้ที่แยกสีได้ยากยังอ่านสถานะได้
function CalendarEvent({ task, onEditTask }: { task: ITask; onEditTask: (task: ITask) => void }) {
  const isDone = task.status === 'done'
  const timeLabel = task.startTime || 'ทั้งวัน'

  return (
    <button
      type="button"
      onClick={() => onEditTask(task)}
      className={cn(
        'group/event flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        isDone
          ? 'bg-income-muted text-income hover:bg-income-muted/70'
          : 'bg-accent text-accent-foreground hover:bg-accent/70',
      )}
      aria-label={`${isDone ? 'เสร็จแล้ว' : 'ค้างอยู่'} ${timeLabel} ${task.title} กดเพื่อแก้ไข`}
      title={`${timeLabel} · ${task.title}`}
    >
      {isDone ? <Check className="size-3 shrink-0" /> : <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
      <span className="tabular shrink-0 font-medium">{timeLabel}</span>
      <span className={cn('truncate', isDone && 'line-through')}>{task.title}</span>
    </button>
  )
}

// ปฏิทินทีมแบบเต็มเดือน: desktop แปะ event ลงในช่องวัน ส่วน mobile ใช้จุดสรุปแล้วอ่านรายละเอียดจากแผงรายวันด้านล่าง
export function PlannerMonthBoard({
  selectedDate,
  onSelectDate,
  visibleMonth,
  onVisibleMonthChange,
  tasksByDate,
  onEditTask,
}: IPlannerMonthBoard) {
  const calendarDays = buildCalendarDays(visibleMonth)
  const todayDate = getTodayDateString()
  const monthLabel = monthLabelFormatter.format(visibleMonth)

  const onPreviousMonth = () => {
    onVisibleMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))
  }

  const onNextMonth = () => {
    onVisibleMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))
  }

  const onToday = () => {
    onSelectDate(todayDate)
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-label="ปฏิทินงานของทีม">
      <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">ปฏิทินทีม</span>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{monthLabel}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToday}>
            วันนี้
          </Button>
          <Button variant="outline" size="icon" onClick={onPreviousMonth} aria-label="เดือนก่อนหน้า">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={onNextMonth} aria-label="เดือนถัดไป">
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border" role="grid" aria-label={monthLabel}>
        {weekdayLabels.map((weekdayLabel, weekdayIndex) => (
          <div
            key={weekdayLabel}
            className={cn(
              'bg-muted/70 px-1 py-2 text-center text-xs font-medium text-muted-foreground sm:px-2 sm:py-2.5',
              (weekdayIndex === 0 || weekdayIndex === 6) && 'text-foreground/70',
            )}
            role="columnheader"
          >
            {weekdayLabel}
          </div>
        ))}

        {calendarDays.map((calendarDay) => {
          const dayTasks = sortDayTasks(tasksByDate.get(calendarDay.dateKey) ?? [])
          const isToday = calendarDay.dateKey === todayDate
          const isSelected = calendarDay.dateKey === selectedDate
          const hiddenEventCount = Math.max(dayTasks.length - MAX_VISIBLE_EVENTS, 0)
          const dayAriaLabel = dayAriaLabelFormatter.format(calendarDay.date)

          return (
            <div
              key={calendarDay.dateKey}
              role="gridcell"
              aria-selected={isSelected}
              className={cn(
                'group/day relative min-h-20 min-w-0 bg-card p-1.5 transition-colors sm:min-h-28 sm:p-2 lg:min-h-32',
                !calendarDay.isCurrentMonth && 'bg-muted/25 text-muted-foreground',
                isSelected && 'z-10 ring-2 ring-inset ring-primary',
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => onSelectDate(calendarDay.dateKey)}
                  className={cn(
                    'tabular flex size-7 items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    isToday && 'bg-primary text-primary-foreground hover:bg-primary/80',
                    !calendarDay.isCurrentMonth && !isToday && 'text-muted-foreground/60',
                  )}
                  aria-label={`${dayAriaLabel}${dayTasks.length > 0 ? ` มี ${dayTasks.length} งาน` : ' ไม่มีงาน'}`}
                >
                  {calendarDay.date.getDate()}
                </button>

                {dayTasks.length > 0 && (
                  <span className="tabular text-[0.625rem] font-medium text-muted-foreground sm:hidden">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {dayTasks.length > 0 && (
                <div className="mt-1 flex items-center gap-1 px-0.5 sm:hidden" aria-hidden>
                  {dayTasks.slice(0, MAX_VISIBLE_EVENTS).map((task) => (
                    <span
                      key={task.id}
                      className={cn('h-1 flex-1 rounded-full', task.status === 'done' ? 'bg-income' : 'bg-primary')}
                    />
                  ))}
                </div>
              )}

              <div className="mt-1 hidden min-w-0 flex-col gap-1 sm:flex">
                {dayTasks.slice(0, MAX_VISIBLE_EVENTS).map((task) => (
                  <CalendarEvent key={task.id} task={task} onEditTask={onEditTask} />
                ))}

                {hiddenEventCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectDate(calendarDay.dateKey)}
                    className="self-start rounded px-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    + อีก {hiddenEventCount} งาน
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-5">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          งานค้างอยู่
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="size-3 text-income" />
          เสร็จแล้ว
        </span>
        <span className="flex items-center gap-1.5">
          <Clock3 className="size-3" />
          งานเรียงตามเวลา
        </span>
        <span className="ml-auto hidden sm:inline">กด event เพื่อดูหรือแก้ไข</span>
      </div>
    </section>
  )
}
