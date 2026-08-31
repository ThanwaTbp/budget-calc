'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellRing, CalendarClock, Clock3 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { usePlannerStore } from '@/features/planner/store/usePlannerStore'
import { getPendingTasksDueByDate } from '@/features/planner/utils/pendingTaskReminder'
import { useSyncStore } from '@/features/sync/store/useSyncStore'
import { fromLocalDateString, getTodayDateString } from '@/utils/date'
import type { ITask } from '@/types/planner'

const MAX_VISIBLE_TASKS = 5
const DATA_SETTLE_DELAY_MILLISECONDS = 150
const SYNC_FALLBACK_DELAY_MILLISECONDS = 3_000

const taskDateFormatter = new Intl.DateTimeFormat('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function buildSummaryMessage(tasks: ITask[], todayDate: string): string {
  const todayCount = tasks.filter((task) => task.date === todayDate).length
  const overdueCount = tasks.length - todayCount

  if (todayCount > 0 && overdueCount > 0) {
    return `มี ${todayCount} งานสำหรับวันนี้ และ ${overdueCount} งานที่เลยกำหนดแล้ว`
  }
  if (todayCount > 0) return `มี ${todayCount} งานที่วางแผนไว้สำหรับวันนี้`
  return `มี ${overdueCount} งานที่เลยกำหนดและยังไม่ได้ทำเครื่องหมายว่าเสร็จ`
}

interface IPendingTaskAlertDialog {
  open: boolean
  onOpenChange: (open: boolean) => void
  dueTasks: ITask[]
  todayDate: string
  onOpenPlanner: () => void
}

export function PendingTaskAlertDialog({
  open,
  onOpenChange,
  dueTasks,
  todayDate,
  onOpenPlanner,
}: IPendingTaskAlertDialog) {
  const visibleTasks = dueTasks.slice(0, MAX_VISIBLE_TASKS)
  const hiddenTaskCount = Math.max(dueTasks.length - visibleTasks.length, 0)
  const summaryMessage = buildSummaryMessage(dueTasks, todayDate)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="bg-[linear-gradient(135deg,var(--warning-muted),var(--card)_72%)] px-5 pt-5 pb-4">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning text-warning-foreground shadow-sm">
              <BellRing />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-lg">คุณมีงานค้างอยู่ {dueTasks.length} งาน</AlertDialogTitle>
            <AlertDialogDescription>{summaryMessage}</AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <div className="max-h-[45svh] overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-2">
            {visibleTasks.map((task) => {
              const isToday = task.date === todayDate

              return (
                <div key={task.id} className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3">
                  <span
                    className={
                      isToday
                        ? 'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning-muted text-warning'
                        : 'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-expense-muted text-expense'
                    }
                  >
                    <CalendarClock className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="min-w-0 truncate font-medium">{task.title}</p>
                      <Badge variant={isToday ? 'secondary' : 'destructive'}>
                        {isToday ? 'วันนี้' : 'เลยกำหนด'}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{taskDateFormatter.format(fromLocalDateString(task.date))}</span>
                      {task.startTime && (
                        <span className="tabular inline-flex items-center gap-1">
                          <Clock3 className="size-3" />
                          {task.endTime ? `${task.startTime}–${task.endTime}` : task.startTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {hiddenTaskCount > 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">และอีก {hiddenTaskCount} งานในหน้าวางแผนงาน</p>
          )}
        </div>

        <AlertDialogFooter className="m-0 rounded-none">
          <AlertDialogCancel>ไว้ทีหลัง</AlertDialogCancel>
          <AlertDialogAction onClick={onOpenPlanner}>
            <CalendarClock />
            เปิดหน้าวางแผนงาน
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function PendingTaskAlert() {
  const router = useRouter()
  const authStatus = useAuthStore((state) => state.status)
  const userId = useAuthStore((state) => state.user?.id ?? null)
  const tasks = usePlannerStore((state) => state.tasks)
  const syncStatus = useSyncStore((state) => state.status)
  const checkedUserIdRef = useRef<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [dueTasks, setDueTasks] = useState<ITask[]>([])
  const todayDate = getTodayDateString()

  useEffect(() => {
    if (authStatus !== 'authenticated' || !userId) {
      checkedUserIdRef.current = null
      return
    }
    if (checkedUserIdRef.current === userId) return

    // รอหนึ่งช่วงสั้นๆ ให้ local cache และ snapshot จาก Appwrite เปลี่ยน store จนครบก่อนสรุปงานค้าง
    // ถ้าซิงก์ช้าหรือค้าง ให้ fallback ไปใช้ cache ภายใน 3 วินาที เพื่อให้ยังเตือนได้เมื่อเครือข่ายมีปัญหา
    const delayMilliseconds =
      syncStatus === 'syncing' ? SYNC_FALLBACK_DELAY_MILLISECONDS : DATA_SETTLE_DELAY_MILLISECONDS
    const timeoutId = window.setTimeout(() => {
      if (useAuthStore.getState().user?.id !== userId) return

      const latestTasks = usePlannerStore.getState().tasks
      const pendingTasks = getPendingTasksDueByDate(latestTasks, getTodayDateString())
      checkedUserIdRef.current = userId

      if (pendingTasks.length > 0) {
        setDueTasks(pendingTasks)
        setIsOpen(true)
      }
    }, delayMilliseconds)

    return () => window.clearTimeout(timeoutId)
  }, [authStatus, syncStatus, tasks, userId])

  const onOpenPlanner = () => {
    setIsOpen(false)
    router.push('/planner')
  }

  return (
    <PendingTaskAlertDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      dueTasks={dueTasks}
      todayDate={todayDate}
      onOpenPlanner={onOpenPlanner}
    />
  )
}
