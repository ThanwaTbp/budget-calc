'use client'

import { useMemo, useState } from 'react'
import { usePlannerStore } from '@/features/planner/store/usePlannerStore'
import type {
  DayIndicatorTone,
  IDayTaskSummary,
  IMonthTaskGroup,
  IMonthTaskSummary,
  PlannerStatusFilter,
  PlannerViewMode,
} from '@/features/planner/type'
import type { ITask } from '@/types/planner'
import { toLocalDateString, fromLocalDateString, toYearMonthString } from '@/utils/date'

// จัดเรียงงานของวันเดียวกัน: งานที่ระบุเวลาเรียงตามเวลาเริ่มก่อน-หลัง ตามด้วยงานไม่ระบุเวลา (เรียงตามลำดับที่สร้าง)
export function sortDayTasks(tasks: ITask[]): ITask[] {
  const timedTasks = tasks.filter((task) => task.startTime !== '')
  const untimedTasks = tasks.filter((task) => task.startTime === '')

  const sortedTimedTasks = [...timedTasks].sort((taskA, taskB) => taskA.startTime.localeCompare(taskB.startTime))
  const sortedUntimedTasks = [...untimedTasks].sort((taskA, taskB) => taskA.createdAt.localeCompare(taskB.createdAt))

  return [...sortedTimedTasks, ...sortedUntimedTasks]
}

// จัดกลุ่มงานทั้งหมดตามวันที่ (key = 'yyyy-MM-dd') ใช้เป็นฐานให้ทั้งปฏิทินและลิสต์ของวันที่เลือก
export function buildTasksByDate(tasks: ITask[]): Map<string, ITask[]> {
  const tasksByDate = new Map<string, ITask[]>()

  tasks.forEach((task) => {
    const bucket = tasksByDate.get(task.date)
    if (bucket) {
      bucket.push(task)
    } else {
      tasksByDate.set(task.date, [task])
    }
  })

  return tasksByDate
}

// สรุปจำนวนงานของแต่ละวัน ใช้วาดตัวบ่งชี้ในช่องวันที่ของปฏิทิน
export function buildDayIndicators(tasks: ITask[]): Map<string, IDayTaskSummary> {
  const summaryByDate = new Map<string, IDayTaskSummary>()

  tasks.forEach((task) => {
    const existingSummary = summaryByDate.get(task.date)

    summaryByDate.set(task.date, {
      date: task.date,
      total: (existingSummary?.total ?? 0) + 1,
      doneCount: (existingSummary?.doneCount ?? 0) + (task.status === 'done' ? 1 : 0),
    })
  })

  return summaryByDate
}

// ตัดสินโทนสีตัวบ่งชี้ของวันหนึ่ง: เสร็จหมดทุกงานแล้วเป็น 'done' นอกนั้น (รวมวันที่ไม่มีงานเลย) ถือเป็น 'pending'
// วันไม่มีงานจะไม่ถูกนำค่านี้ไปวาดจริง (ฝั่ง UI เช็ค total > 0 ก่อนเสมอ) แต่ฟังก์ชันยังต้องคืนค่าที่แน่นอนเสมอ ไม่ throw
export function getDayIndicatorTone(summary: IDayTaskSummary): DayIndicatorTone {
  if (summary.total > 0 && summary.doneCount === summary.total) return 'done'
  return 'pending'
}

// สรุปยอดงานของเดือนที่ visibleMonth ระบุ (เทียบด้วย prefix 'yyyy-MM' ของ date)
export function calcMonthSummary(tasks: ITask[], visibleMonth: Date): IMonthTaskSummary {
  const monthKey = toYearMonthString(visibleMonth)
  const monthTasks = tasks.filter((task) => task.date.startsWith(monthKey))
  const doneCount = monthTasks.filter((task) => task.status === 'done').length

  return {
    total: monthTasks.length,
    done: doneCount,
    todo: monthTasks.length - doneCount,
  }
}

// จัดกลุ่มงานของเดือนที่ visibleMonth ระบุตามวันที่ เรียงวันเก่า→ใหม่ (ในวันเดียวกันเรียงตามเวลาผ่าน sortDayTasks)
// กรองด้วย statusFilter ก่อนจัดกลุ่ม ทำให้วันที่ไม่มีงานตรงตัวกรองหายไปจากลิสต์โดยอัตโนมัติ
export function buildMonthGroups(tasks: ITask[], visibleMonth: Date, statusFilter: PlannerStatusFilter): IMonthTaskGroup[] {
  const monthKey = toYearMonthString(visibleMonth)
  const monthTasks = tasks.filter((task) => task.date.startsWith(monthKey))
  const filteredTasks = statusFilter === 'all' ? monthTasks : monthTasks.filter((task) => task.status === statusFilter)
  const tasksByDate = buildTasksByDate(filteredTasks)
  const todayKey = toLocalDateString(new Date())

  return Array.from(tasksByDate.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, dayTasks]) => ({
      date,
      tasks: sortDayTasks(dayTasks),
      isToday: date === todayKey,
    }))
}

// รวม logic ของหน้าวางแผนงาน: วันที่เลือก, เดือนที่กำลังดูบนปฏิทิน, มุมมองรายวัน/รายเดือน, ตัวกรองสถานะ
// และข้อมูลที่แปลงแล้วพร้อมใช้วาด UI (ปฏิทิน + ลิสต์งาน + แถบสรุป)
export function usePlannerBoard() {
  const tasks = usePlannerStore((state) => state.tasks)

  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()))
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [statusFilter, setStatusFilter] = useState<PlannerStatusFilter>('all')
  const [viewMode, setViewMode] = useState<PlannerViewMode>('calendar')

  const tasksByDate = useMemo(() => buildTasksByDate(tasks), [tasks])
  const dayIndicators = useMemo(() => buildDayIndicators(tasks), [tasks])
  const monthSummary = useMemo(() => calcMonthSummary(tasks, visibleMonth), [tasks, visibleMonth])
  const monthGroups = useMemo(
    () => buildMonthGroups(tasks, visibleMonth, statusFilter),
    [tasks, visibleMonth, statusFilter],
  )

  const selectedDayAllTasks = useMemo(
    () => sortDayTasks(tasksByDate.get(selectedDate) ?? []),
    [tasksByDate, selectedDate],
  )

  const selectedDayTasks = useMemo(() => {
    if (statusFilter === 'all') return selectedDayAllTasks
    return selectedDayAllTasks.filter((task) => task.status === statusFilter)
  }, [selectedDayAllTasks, statusFilter])

  const selectedDayCounts = useMemo(
    () => ({
      all: selectedDayAllTasks.length,
      todo: selectedDayAllTasks.filter((task) => task.status === 'todo').length,
      done: selectedDayAllTasks.filter((task) => task.status === 'done').length,
    }),
    [selectedDayAllTasks],
  )

  // เลือกวันที่ใหม่แล้วให้เดือนที่แสดงบนปฏิทินตามไปด้วย (กรณีกดวันนอกเดือนปัจจุบันที่โผล่มาในตาราง หรือกดหัวกลุ่มในมุมมองรายเดือน)
  const onSelectDate = (nextDate: string) => {
    setSelectedDate(nextDate)
    const nextMonth = fromLocalDateString(nextDate)
    setVisibleMonth((currentMonth) => {
      const isSameMonth =
        currentMonth.getFullYear() === nextMonth.getFullYear() && currentMonth.getMonth() === nextMonth.getMonth()
      return isSameMonth ? currentMonth : new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1)
    })
  }

  const onVisibleMonthChange = (nextMonth: Date) => {
    setVisibleMonth(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1))
  }

  const onStatusFilterChange = (nextFilter: PlannerStatusFilter) => {
    setStatusFilter(nextFilter)
  }

  const onViewModeChange = (nextMode: PlannerViewMode) => {
    setViewMode(nextMode)
  }

  return {
    selectedDate,
    onSelectDate,
    visibleMonth,
    onVisibleMonthChange,
    statusFilter,
    onStatusFilterChange,
    viewMode,
    onViewModeChange,
    tasksByDate,
    dayIndicators,
    monthSummary,
    monthGroups,
    monthTaskCount: monthSummary.total,
    selectedDayTasks,
    selectedDayCounts,
    hasAnyTask: tasks.length > 0,
  }
}
