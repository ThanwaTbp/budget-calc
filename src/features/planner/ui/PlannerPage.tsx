'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarPlus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { usePlannerBoard } from '@/features/planner/hooks/usePlannerBoard'
import { DayTaskList } from '@/features/planner/ui/DayTaskList'
import { MonthTaskList } from '@/features/planner/ui/MonthTaskList'
import { PlannerCalendar } from '@/features/planner/ui/PlannerCalendar'
import { PlannerSummaryBar } from '@/features/planner/ui/PlannerSummaryBar'
import { PlannerViewToggle } from '@/features/planner/ui/PlannerViewToggle'
import { TaskDialog } from '@/features/planner/ui/TaskDialog'
import { useTaskWeather } from '@/features/weather/hooks/useTaskWeather'
import type { ITask } from '@/types/planner'

const monthLabelFormatter = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' })

export function PlannerPage() {
  const isHydrated = useHydrated()
  const {
    selectedDate,
    onSelectDate,
    visibleMonth,
    onVisibleMonthChange,
    statusFilter,
    onStatusFilterChange,
    viewMode,
    onViewModeChange,
    dayIndicators,
    monthSummary,
    monthGroups,
    monthTaskCount,
    selectedDayTasks,
    selectedDayCounts,
    hasAnyTask,
  } = usePlannerBoard()

  // เรียก useTaskWeather() ครั้งเดียวที่นี่แล้วส่ง getWeatherForDate ลงไปทาง props ห้ามเรียกซ้ำในลูก (จะยิง API ซ้ำ)
  const { getWeatherForDate, locationName, hasForecast } = useTaskWeather()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ITask | null>(null)

  const onCreateTask = () => {
    setEditingTask(null)
    setIsDialogOpen(true)
  }

  const onEditTask = (task: ITask) => {
    setEditingTask(task)
    setIsDialogOpen(true)
  }

  const onDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) setEditingTask(null)
  }

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="วางแผนงาน" description="จัดตารางงานรายวัน ดูภาพรวมทั้งเดือนได้ในที่เดียว">
        <Button size="lg" onClick={onCreateTask}>
          <Plus />
          เพิ่มงาน
        </Button>
      </PageHeader>

      {hasForecast && (
        <p className="text-sm text-muted-foreground">
          สภาพอากาศ: {locationName} ·{' '}
          <Link href="/weather" className="underline hover:text-foreground">
            เปลี่ยนสถานที่
          </Link>
        </p>
      )}

      <PlannerSummaryBar monthSummary={monthSummary} monthLabel={monthLabelFormatter.format(visibleMonth)} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="rounded-xl border border-border bg-card p-2 shadow-sm">
          <PlannerCalendar
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            visibleMonth={visibleMonth}
            onVisibleMonthChange={onVisibleMonthChange}
            dayIndicators={dayIndicators}
          />
        </div>

        {hasAnyTask ? (
          <div className="flex flex-col gap-3">
            <PlannerViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

            {viewMode === 'day' ? (
              <DayTaskList
                selectedDate={selectedDate}
                tasks={selectedDayTasks}
                counts={selectedDayCounts}
                statusFilter={statusFilter}
                onStatusFilterChange={onStatusFilterChange}
                onCreateTask={onCreateTask}
                onEditTask={onEditTask}
                weather={getWeatherForDate(selectedDate)}
              />
            ) : (
              <MonthTaskList
                monthLabel={monthLabelFormatter.format(visibleMonth)}
                monthTaskCount={monthTaskCount}
                groups={monthGroups}
                statusFilter={statusFilter}
                onStatusFilterChange={onStatusFilterChange}
                onSelectDate={onSelectDate}
                onCreateTask={onCreateTask}
                onEditTask={onEditTask}
                getWeatherForDate={getWeatherForDate}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-border bg-card p-6 shadow-sm">
            <EmptyState icon={CalendarPlus} title="ยังไม่มีงานเลย" description="เพิ่มงานแรกเพื่อเริ่มวางแผนตารางงานของคุณ">
              <Button onClick={onCreateTask}>
                <Plus />
                เพิ่มงาน
              </Button>
            </EmptyState>
          </div>
        )}
      </div>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={onDialogOpenChange}
        selectedDate={selectedDate}
        editingTask={editingTask}
      />
    </div>
  )
}
