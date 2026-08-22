'use client'

import { CalendarPlus, Plus, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/common/EmptyState'
import { parseLocalDateString } from '@/features/planner/hooks/usePlannerBoard'
import { TaskListItem } from '@/features/planner/ui/TaskListItem'
import type { PlannerStatusFilter } from '@/features/planner/type'
import type { ITask } from '@/types/planner'

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
}: IDayTaskList) {
  const dayTitle = dayTitleFormatter.format(parseLocalDateString(selectedDate))

  // งานที่ระบุเวลาเรียงมาก่อนแล้ว (จาก sortDayTasks) หาตำแหน่งงานไม่ระบุเวลาตัวแรกเพื่อคั่นเส้นแบ่ง
  const firstUntimedIndex = tasks.findIndex((task) => task.startTime === '')
  const dividerIndex = firstUntimedIndex > 0 ? firstUntimedIndex : -1

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold tracking-tight">{dayTitle}</h2>
          <span className="text-sm text-muted-foreground">{counts.all} งาน</span>
        </div>

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
