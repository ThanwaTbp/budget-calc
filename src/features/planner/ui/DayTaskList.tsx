'use client'

import { CalendarPlus, Plus, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/common/EmptyState'
import { parseLocalDateString } from '@/features/planner/hooks/usePlannerBoard'
import { DayWeatherBadge } from '@/features/planner/ui/DayWeatherBadge'
import { TaskListItem } from '@/features/planner/ui/TaskListItem'
import type { PlannerStatusFilter } from '@/features/planner/type'
import type { ITaskWeather } from '@/features/weather/hooks/useTaskWeather'
import type { ITask } from '@/types/planner'
import { cn } from '@/lib/utils'

interface IDayTaskCounts {
  all: number
  todo: number
  done: number
}

interface IDayTaskList {
  selectedDate: string
  tasks: ITask[]
  counts: IDayTaskCounts
  statusFilter: PlannerStatusFilter
  onStatusFilterChange: (filter: PlannerStatusFilter) => void
  onCreateTask: () => void
  onEditTask: (task: ITask) => void
  weather: ITaskWeather | null
}

// ข้อความเตือนใต้หัววัน — ให้เป็นประโยชน์จริง (แนะนำสิ่งที่ควรทำ) ไม่ใช่แค่พูดตัวเลขซ้ำจาก badge
// คืน null เมื่อไม่มีพยากรณ์ หรือระดับเตือนเป็น 'normal' (ไม่ต้องกวนใจผู้ใช้)
export function getWeatherAdviceMessage(weather: ITaskWeather | null): string | null {
  if (!weather) return null

  const precipitationPercent = Math.round(weather.precipitationProbability)

  if (weather.alertLevel === 'severe') {
    return `วันนี้มี${weather.description} โอกาสฝน ${precipitationPercent}% — เผื่อเวลาเดินทางหรือเลื่อนงานกลางแจ้ง`
  }

  if (weather.alertLevel === 'caution') {
    return `วันนี้มีโอกาสฝน ${precipitationPercent}% — เตรียมร่มไว้ด้วย`
  }

  return null
}

const dayTitleFormatter = new Intl.DateTimeFormat('th-TH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function TimeDivider() {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="h-px flex-1 bg-border" />
      <span className="text-sm text-muted-foreground">ไม่ระบุเวลา</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

// รายการงานของวันที่เลือก พร้อมแท็บกรองสถานะ จัดกลุ่มงานมีเวลาไว้ก่อนแล้วคั่นด้วยเส้น 'ไม่ระบุเวลา'
export function DayTaskList({
  selectedDate,
  tasks,
  counts,
  statusFilter,
  onStatusFilterChange,
  onCreateTask,
  onEditTask,
  weather,
}: IDayTaskList) {
  const dayTitle = dayTitleFormatter.format(parseLocalDateString(selectedDate))

  // งานที่ระบุเวลาเรียงมาก่อนแล้ว (จาก sortDayTasks) หาตำแหน่งงานไม่ระบุเวลาตัวแรกเพื่อคั่นเส้นแบ่ง
  const firstUntimedIndex = tasks.findIndex((task) => task.startTime === '')
  const dividerIndex = firstUntimedIndex > 0 ? firstUntimedIndex : -1

  // แถบเตือนสภาพอากาศ แสดงเฉพาะระดับ severe/caution และเฉพาะวันที่มีงานอยู่จริง (ไม่กวนใจวันว่าง)
  const weatherAdviceMessage = counts.all > 0 ? getWeatherAdviceMessage(weather) : null

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold tracking-tight">{dayTitle}</h2>
            <DayWeatherBadge weather={weather} variant="detailed" />
          </div>
          <span className="text-sm text-muted-foreground">{counts.all} งาน</span>
        </div>

        {weatherAdviceMessage && weather && (
          <p
            className={cn(
              'rounded-lg border px-3 py-2 text-sm',
              weather.alertLevel === 'severe' && 'border-expense/40 bg-expense-muted text-expense',
              weather.alertLevel === 'caution' && 'border-warning/40 bg-warning-muted text-warning',
            )}
          >
            {weatherAdviceMessage}
          </p>
        )}

        <Tabs value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as PlannerStatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
            <TabsTrigger value="todo">ค้างอยู่</TabsTrigger>
            <TabsTrigger value="done">เสร็จแล้ว</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {counts.all === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="ยังไม่มีงานในวันนี้"
          description={`ยังไม่มีงานที่วางแผนไว้สำหรับวัน${dayTitle}`}
        >
          <Button onClick={onCreateTask}>
            <Plus />
            เพิ่มงาน
          </Button>
        </EmptyState>
      ) : tasks.length === 0 ? (
        <EmptyState icon={SearchX} title="ไม่พบงานตามตัวกรองนี้" description="ลองเปลี่ยนแท็บตัวกรองสถานะดูอีกครั้ง" />
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task, index) => (
            <div key={task.id} className="flex flex-col gap-2">
              {index === dividerIndex && <TimeDivider />}
              <TaskListItem task={task} onEditTask={onEditTask} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
