'use client'

import { useState } from 'react'
import { CalendarPlus, ChevronDown, Plus, SearchX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/common/EmptyState'
import { parseLocalDateString } from '@/features/planner/hooks/usePlannerBoard'
import { DayWeatherBadge } from '@/features/planner/ui/DayWeatherBadge'
import { TaskListItem } from '@/features/planner/ui/TaskListItem'
import type { IMonthTaskGroup, PlannerStatusFilter } from '@/features/planner/type'
import type { ITaskWeather } from '@/features/weather/hooks/useTaskWeather'
import type { ITask } from '@/types/planner'
import { cn } from '@/lib/utils'

// จำนวนกลุ่มวันที่แสดงตอนเปิดหน้าแรก กันลิสต์ยาวเกินไปตอนเดือนนั้นมีงานกระจายหลายสิบวัน
const INITIAL_VISIBLE_GROUP_COUNT = 10

interface IMonthTaskList {
  monthLabel: string
  monthTaskCount: number
  groups: IMonthTaskGroup[]
  statusFilter: PlannerStatusFilter
  onStatusFilterChange: (filter: PlannerStatusFilter) => void
  onSelectDate: (date: string) => void
  onCreateTask: () => void
  onEditTask: (task: ITask) => void
  getWeatherForDate: (date: string) => ITaskWeather | null
}

const groupHeaderFormatter = new Intl.DateTimeFormat('th-TH', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

interface IMonthTaskGroupSection {
  group: IMonthTaskGroup
  onSelectDate: (date: string) => void
  onEditTask: (task: ITask) => void
  weather: ITaskWeather | null
}

// หัวข้อของหนึ่งวัน กดแล้วเลือกวันนั้นบนปฏิทินด้วย วันนี้ให้หัวข้อเน้นสีหลักพร้อมป้าย 'วันนี้'
function MonthTaskGroupSection({ group, onSelectDate, onEditTask, weather }: IMonthTaskGroupSection) {
  const groupTitle = groupHeaderFormatter.format(parseLocalDateString(group.date))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelectDate(group.date)}
          className={cn(
            'flex flex-wrap items-center gap-2 text-left text-sm hover:underline',
            group.isToday ? 'font-semibold text-primary' : 'font-medium text-foreground',
          )}
        >
          <span>{groupTitle}</span>
          {group.isToday && (
            <Badge variant="outline" className="border-transparent bg-primary/10 text-primary">
              วันนี้
            </Badge>
          )}
          <span className="text-xs font-normal text-muted-foreground">{group.tasks.length} งาน</span>
        </button>

        <DayWeatherBadge weather={weather} variant="compact" />
      </div>

      <div className="flex flex-col gap-2">
        {group.tasks.map((task) => (
          <TaskListItem key={task.id} task={task} onEditTask={onEditTask} />
        ))}
      </div>
    </div>
  )
}

// รายการงานของเดือนที่กำลังดูอยู่บนปฏิทิน จัดกลุ่มตามวัน เรียงวันเก่า→ใหม่ แสดง 10 วันแรกก่อนแล้วกดดูเพิ่มได้
export function MonthTaskList({
  monthLabel,
  monthTaskCount,
  groups,
  statusFilter,
  onStatusFilterChange,
  onSelectDate,
  onCreateTask,
  onEditTask,
  getWeatherForDate,
}: IMonthTaskList) {
  const [isShowingAllGroups, setIsShowingAllGroups] = useState(false)

  const visibleGroups = isShowingAllGroups ? groups : groups.slice(0, INITIAL_VISIBLE_GROUP_COUNT)
  const hasMoreGroups = !isShowingAllGroups && groups.length > INITIAL_VISIBLE_GROUP_COUNT

  const onShowMoreGroups = () => setIsShowingAllGroups(true)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold tracking-tight">{monthLabel}</h2>
          <span className="text-sm text-muted-foreground">{monthTaskCount} งาน</span>
        </div>

        <Tabs value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as PlannerStatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
            <TabsTrigger value="todo">ค้างอยู่</TabsTrigger>
            <TabsTrigger value="done">เสร็จแล้ว</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {monthTaskCount === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="ยังไม่มีงานในเดือนนี้"
          description={`ยังไม่มีงานที่วางแผนไว้สำหรับ${monthLabel}`}
        >
          <Button onClick={onCreateTask}>
            <Plus />
            เพิ่มงาน
          </Button>
        </EmptyState>
      ) : groups.length === 0 ? (
        <EmptyState icon={SearchX} title="ไม่พบงานตามตัวกรองนี้" description="ลองเปลี่ยนแท็บตัวกรองสถานะดูอีกครั้ง" />
      ) : (
        <div className="flex flex-col gap-4">
          {visibleGroups.map((group) => (
            <MonthTaskGroupSection
              key={group.date}
              group={group}
              onSelectDate={onSelectDate}
              onEditTask={onEditTask}
              weather={getWeatherForDate(group.date)}
            />
          ))}

          {hasMoreGroups && (
            <Button variant="outline" size="sm" className="self-center" onClick={onShowMoreGroups}>
              <ChevronDown />
              แสดงเพิ่ม
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
